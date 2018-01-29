import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {SettingsService} from '../../../core/settings/settings-service';
import {ChangeHistoryUtil} from '../../../core/model/change-history-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {ResourcesState} from './resources-state';
import {includedIn, remove, isNot} from '../../../util/list-util';
import {inform} from '../../../util/observer-util';


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public projectDocument: Document;
    private selectedDocument: IdaiFieldDocument|undefined;
    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];

    private deselectionObservers: Array<Observer<Document>> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private navigationPathManager: NavigationPathManager,
        private mainTypeDocumentsManager: MainTypeDocumentsManager,
        private resourcesState: ResourcesState
    ) {
        changesStream.remoteChangesNotifications().subscribe(this.handleChange);
    }


    public getDocuments = () => this.documents;

    public getSelectedDocument = () => this.selectedDocument;

    public removeFromDocuments = (document: Document) => this.documents = remove(this.documents, document);

    public isNewDocumentFromRemote = (document: Document) => this.newDocumentsFromRemote.indexOf(document) > -1;


    public async populateProjectDocument() {

        try {
            this.projectDocument = await this.datastore.get(this.settingsService.getSelectedProject() as any);
        } catch (_) {
            console.log('cannot find project document')
        }
    }


    public async setQueryString(q: string) {

        this.resourcesState.setQueryString(q);

        await this.populateDocumentList();
        if (!this.documents.some(hasEqualId(this.selectedDocument))) this.deselect();
    }


    public async setTypeFilters(types: string[]) {

        this.resourcesState.setTypeFilters(types);

        await this.populateDocumentList();
        if (!this.documents.some(hasEqualId(this.selectedDocument))) this.deselect();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        this.navigationPathManager.moveInto(document);

        await this.populateDocumentList();
        if (!this.documents.some(hasEqualId(this.selectedDocument))) this.deselect();
    }


    public async setSelectedById(resourceId: string) {

        await this.setSelected(await this.datastore.get(resourceId));
    }


    public deselect() {

        if (this.selectedDocument) {

            this.selectAndNotify(undefined);
            this.documents = this.documents.filter(hasId);
            this.resourcesState.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public async setSelected(document: IdaiFieldDocument): Promise<any> {

        if (document == this.selectedDocument) return;

        this.selectAndNotify(document);

        this.documents = this.documents.filter(hasId);
        remove(this.newDocumentsFromRemote, document);

        return this.performUpdates(document);
    }


    public deselectionNotifications(): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {
            this.deselectionObservers.push(observer);
        })
    }


    private selectAndNotify(document: IdaiFieldDocument|undefined) {

        if (this.selectedDocument && this.deselectionObservers) {
            this.deselectionObservers.forEach(inform(this.selectedDocument));
        }
        this.selectedDocument = document;
    }


    private async performUpdates(document: IdaiFieldDocument) {

        if (!(await this.createUpdatedDocumentList()).some(hasEqualId(document))) {

            await this.makeSureSelectedDocumentAppearsInList();
            await this.populateDocumentList();
        }
    }


    private async adjustQuerySettingsIfNecessary() {

        if (!(await this.createUpdatedDocumentList()).some(hasEqualId(this.selectedDocument))) {

            this.resourcesState.setQueryString('');
            this.resourcesState.setTypeFilters(undefined as any);
        }
    }


    private async handleChange(changedDocument: Document) {

        if (!changedDocument || !this.documents) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.resourcesState.getViewType()) {
            return this.mainTypeDocumentsManager.populate();
        }

        const oldDocuments = this.documents; // TODO why do we need the tempvar, we simply could run populateDocumentList as last statement as an alternative, right?
        await this.populateDocumentList();

        this.documents
            .filter(isNot(includedIn(oldDocuments)))
            .filter(async document =>
                ChangeHistoryUtil.isRemoteChange(
                    document,
                    await this.datastore.getConflictedRevisions(document.resource.id as string),
                    this.settingsService.getUsername())
                )
            .forEach(document => this.newDocumentsFromRemote.push(document)); // TODO check if we can hide passing document explicitely
    }


    public async populateDocumentList() {

        this.newDocumentsFromRemote = [];
        this.documents = await this.createUpdatedDocumentList();
    }


    public async createUpdatedDocumentList(): Promise<Array<Document>> {

        const isRecordedInTarget = this.makeIsRecordedInTarget();
        if (!isRecordedInTarget) return [];

        return (await this.fetchDocuments(
                    this.makeDocsQuery(isRecordedInTarget.resource.id as string))
            ).filter(hasId);
    }


    private makeIsRecordedInTarget(): Document|undefined {

        return this.resourcesState.isInOverview()
            ? this.projectDocument
            : this.resourcesState.getMainTypeDocument();
    }


    private async makeSureSelectedDocumentAppearsInList() {

        this.mainTypeDocumentsManager
            .selectLinkedOperationTypeDocumentForSelectedDocument(this.selectedDocument);

        await this.navigationPathManager
            .updateNavigationPathForDocument(this.selectedDocument as IdaiFieldDocument);

        await this.adjustQuerySettingsIfNecessary();
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            return (await this.datastore.find(query)).documents;
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
        }
    }


    private makeDocsQuery(mainTypeDocumentResourceId: string): Query {

        const constraints = this.makeLiesWithinConstraint();
        constraints['isRecordedIn:contain'] = mainTypeDocumentResourceId;

        const query: Query = {
            q: this.resourcesState.getQueryString(),
            constraints: constraints
        };

        if (this.resourcesState.getTypeFilters()) {
            query.types = this.resourcesState.getTypeFilters();
        }

        return query;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private makeLiesWithinConstraint(): { [name: string]: string}  {

        const rootDoc = this.resourcesState.getNavigationPath().rootDocument;
        return rootDoc
            ? { 'liesWithin:contain': rootDoc.resource.id as string }
            : { 'liesWithin:exist': 'UNKNOWN' }
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) { // TODO rewrite with some
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
        }

        return false;
    }
}