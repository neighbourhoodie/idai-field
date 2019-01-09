import {Component} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {includedIn, isNot} from 'tsfun';
import {DatastoreErrors, Document, IdaiFieldDocument, IdaiFieldImageDocument, Messages,
    ProjectConfiguration} from 'idai-components-2';
import {ConflictDeletedModalComponent} from './dialog/conflict-deleted-modal.component';
import {clone} from '../../core/util/object-util';
import {DoceditActiveTabService} from './docedit-active-tab-service';
import {DeleteModalComponent} from './dialog/delete-modal.component';
import {EditSaveDialogComponent} from './dialog/edit-save-dialog.component';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {DocumentHolder} from './document-holder';
import {TypeUtility} from '../../core/model/type-utility';
import {M} from '../m';
import {MessagesConversion} from './messages-conversion';
import {Loading} from '../../widgets/loading';


@Component({
    selector: 'detail-modal',
    moduleId: module.id,
    templateUrl: './docedit.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * Uses the document edit forms of idai-components-2 and adds styling
 * and navigation items like save and back buttons and modals
 * including the relevant functionality like validation,
 * persistence handling, conflict resolution etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditComponent {

    private parentLabel: string|undefined = undefined;
    private showDoceditImagesTab: boolean = false;
    private operationInProgress: 'save'|'delete'|'none' = 'none';
    private subModalOpened: boolean = false;
    private escapeKeyPressed: boolean = false;


    constructor(
        public activeModal: NgbActiveModal,
        public documentHolder: DocumentHolder,
        private messages: Messages,
        private modalService: NgbModal,
        private datastore: DocumentDatastore,
        private typeUtility: TypeUtility,
        private activeTabService: DoceditActiveTabService,
        private projectConfiguration: ProjectConfiguration,
        private loading: Loading,
        private i18n: I18n) {
    }

    public isChanged = () => this.documentHolder.isChanged();

    public isLoading = () => this.loading.isLoading();

    public getFieldDefinitionLabel: (_: string) => string;


    public getRelationDefinitions = () => this.projectConfiguration.getRelationDefinitions(
        this.documentHolder.clonedDocument.resource.type, false, 'editable');


    public async onKeyDown(event: KeyboardEvent) {

        switch(event.key) {
            case 'Escape':
                if (!this.subModalOpened && !this.escapeKeyPressed) {
                    this.escapeKeyPressed = true;
                    if (event.srcElement) (event.srcElement as HTMLElement).blur();
                    await this.cancel();
                } else {
                    this.escapeKeyPressed = true;
                }
                break;
            case 's':
                if ((event.ctrlKey || event.metaKey) && this.isChanged() && !this.isLoading()) {
                    await this.save();
                }
                break;
        }
    }


    public onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public getActiveTab() {

        return 'docedit-' + this.activeTabService.getActiveTab() + '-tab';
    }


    public changeActiveTab(event: any) {

        this.activeTabService.setActiveTab(event.nextId.replace('docedit-','').replace('-tab',''));
    };


    public async setDocument(document: IdaiFieldDocument|IdaiFieldImageDocument) {

        this.documentHolder.setDocument(document);

        if (!document.resource.id) this.activeTabService.setActiveTab('fields');

        this.showDoceditImagesTab = (!
            (this.typeUtility.getSubtypes('Image'))[document.resource.type]
        );

        this.getFieldDefinitionLabel = (fieldName: string) =>
            this.projectConfiguration.getFieldDefinitionLabel(document.resource.type, fieldName);

        this.parentLabel = await this.fetchParentLabel(document);
    }


    public changeType(newType: string) {

        const {invalidFields, invalidRelations} = this.documentHolder.changeType(newType);
        this.showTypeChangeFieldsWarning(invalidFields);
        this.showTypeChangeRelationsWarning(invalidRelations);
    }


    public async cancel() {

        if (this.documentHolder.isChanged()) {
            await this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public async openDeleteModal() {

        this.subModalOpened = true;

        const ref: NgbModalRef = this.modalService.open(DeleteModalComponent, { keyboard: false });
        ref.componentInstance.setDocument(this.documentHolder.clonedDocument);
        ref.componentInstance.setCount(await this.fetchIsRecordedInCount(this.documentHolder.clonedDocument));

        try {
            const decision: string = await ref.result;
            if (decision === 'delete') await this.deleteDocument();
        } catch(err) {
            // DeleteModal has been canceled
        } finally {
            this.subModalOpened = false;
        }
    }


    public async save() {

        this.operationInProgress = 'save';
        this.loading.start('docedit');

        const documentBeforeSave: Document = clone(this.documentHolder.clonedDocument);

        try {
            const documentAfterSave: Document = await this.documentHolder.save();
            await this.handleSaveSuccess(documentBeforeSave, documentAfterSave);
        } catch (errorWithParams) {
            await this.handleSaveError(errorWithParams);
        } finally {
            this.loading.stop();
            this.operationInProgress = 'none';
        }
    }


    private async handleSaveSuccess(documentBeforeSave: Document, documentAfterSave: Document) {

        try {
            if (DoceditComponent.detectSaveConflicts(documentBeforeSave, documentAfterSave)) {
                this.handleSaveConflict(documentAfterSave);
            } else {
                await this.closeModalAfterSave(documentAfterSave.resource.id);
            }
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async handleSaveError(errorWithParams: any) {

        if (errorWithParams[0] == DatastoreErrors.DOCUMENT_NOT_FOUND) {
            this.handleDeletedConflict();
            return undefined;
        }

        if (errorWithParams.length > 0) {
            this.messages.add(MessagesConversion.convertMessage(errorWithParams, this.projectConfiguration));
        } else {
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
        }
    }


    private async fetchParentLabel(document: IdaiFieldDocument|IdaiFieldImageDocument) {

        return !document.resource.relations.isRecordedIn
                || document.resource.relations.isRecordedIn.length === 0
            ? this.i18n({ id: 'docedit.parentLabel.project', value: 'Projekt' })
            : document.resource.id
                ? undefined
                : (await this.datastore.get(
                        document.resource.relations['liesWithin']
                            ? document.resource.relations['liesWithin'][0]
                            : document.resource.relations['isRecordedIn'][0]
                        )
                ).resource.identifier;
    }


    private async openEditSaveDialogModal() {

        this.subModalOpened = true;

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false }
            );
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                await this.save();
            } else if (result === 'discard') {
                this.activeModal.dismiss('discard');
            }
        } catch(err) {
            // EditSaveDialogModal has been canceled
        } finally {
            this.subModalOpened = false;
        }
    }


    private async fetchIsRecordedInCount(document: Document): Promise<number> {

        return !document.resource.id
            ? 0
            : (await this.datastore.find(
                    { q: '', constraints: { 'isRecordedIn:contain': document.resource.id }} as any)
            ).documents.length;
    }


    private showTypeChangeFieldsWarning(invalidFields: string[]) {

        if (invalidFields.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_TYPE_CHANGE_FIELDS,
                invalidFields
                    .map(this.getFieldDefinitionLabel)
                    .reduce((acc, fieldLabel) => acc + ', ' + fieldLabel)
            ]);
        }
    }


    private showTypeChangeRelationsWarning(invalidRelations: string[]) {

        if (invalidRelations.length > 0) {
            this.messages.add([
                M.DOCEDIT_WARNING_TYPE_CHANGE_RELATIONS,
                invalidRelations
                    .map((relationName: string) => this.projectConfiguration.getRelationDefinitionLabel(relationName))
                    .reduce((acc, relationLabel) => acc + ', ' + relationLabel)
            ]);
        }
    }


    private async closeModalAfterSave(resourceId: string): Promise<any> {

        this.activeModal.close({
            document: (await this.datastore.get(resourceId))
        });
        this.messages.add([M.DOCEDIT_SUCCESS_SAVE]);
    }


    private async deleteDocument() {

        this.operationInProgress = 'delete';
        this.loading.start('docedit');

        try {
            await this.documentHolder.remove();
            this.activeModal.dismiss('deleted');
            this.messages.add([M.DOCEDIT_SUCCESS_DELETE]);
        } catch(err) {
            this.messages.add(err);
        }

        this.loading.stop();
        this.operationInProgress = 'none';
    }


    private handleSaveConflict(documentAfterSave: Document) {

        this.documentHolder.setDocument(documentAfterSave);
        this.activeTabService.setActiveTab('conflicts');
        this.messages.add([M.DOCEDIT_WARNING_SAVE_CONFLICT]);
    }


    private handleDeletedConflict() {

        this.modalService.open(
            ConflictDeletedModalComponent, {size: 'lg', windowClass: 'conflict-deleted-modal'}
        ).result.then(() => {
            this.documentHolder.makeClonedDocAppearNew();
        }).catch(doNothing);
    }


    private static detectSaveConflicts(documentBeforeSave: Document, documentAfterSave: Document): boolean {

        const conflictsBeforeSave: string[] = (documentBeforeSave as any)['_conflicts'];
        const conflictsAfterSave: string[] =  (documentAfterSave as any)['_conflicts'];

        if (!conflictsBeforeSave && conflictsAfterSave && conflictsAfterSave.length >= 1) return true;
        if (!conflictsAfterSave) return false;

        return conflictsAfterSave.find(isNot(includedIn(conflictsBeforeSave))) !== undefined;
    }
}


const doNothing = () => {};