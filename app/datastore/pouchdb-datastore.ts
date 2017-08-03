import {Query, ReadDatastore, Datastore, DatastoreErrors} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {ConfigLoader, ProjectConfiguration} from 'idai-components-2/configuration';
import {IdGenerator} from './id-generator';
import {Observable} from 'rxjs/Observable';
import {M} from '../m';
import {IdaiFieldDatastore} from './idai-field-datastore';
import {SyncState} from './sync-state';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PouchdbManager} from './pouchdb-manager';
import {ResultSets} from "../util/result-sets";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    protected db: any;
    private observers = [];
    private config: ProjectConfiguration;
    private syncHandles = [];

    constructor(configLoader: ConfigLoader, private pouchdbManager: PouchdbManager) {

        this.db = pouchdbManager.getDb();
        configLoader.getProjectConfiguration()
            .then(config => this.config = config, () => {})
            .then(() => this.setupServer())
            .then(() => this.setupChangesEmitter())
    }

    /**
     * Implements {@link Datastore#create}.
     * @param document
     * @param initial
     * @returns {Promise<Document>} same instance of the document
     */
    public create(document: Document, initial: boolean = false): Promise<Document> {

        let reset = this.resetDocOnErr(document);

        return this.proveThatDoesNotExist(document)
            .then(() => {

                if (!document.resource.id) {
                    document.resource.id = IdGenerator.generateId();
                }
                document['_id'] = document.resource.id;
                document.resource['_parentTypes'] = this.config
                    .getParentTypes(document.resource.type);

                return this.db.put(document, { force: true }).catch(
                    err => {
                        console.error(err);
                        return Promise.reject(DatastoreErrors.GENERIC_SAVE_ERROR);
                    }
                );
            })
            .then(result => {

                document['_rev'] = result['rev'];
                return Promise.resolve(this.cleanDoc(document));

            }).catch(keyOfM => {

                reset(document);
                return Promise.reject([keyOfM]);
            })
    }

    /**
     * Implements {@link Datastore#update}.
     * @param document
     * @returns {Promise<Document>} same instance of the document
     */
    public update(document: Document): Promise<Document> {

        if (document.resource.id == null) {
            return <any> Promise.reject([DatastoreErrors.DOCUMENT_NO_RESOURCE_ID]);
        }

        const reset = this.resetDocOnErr(document);
        return this.get(document.resource.id).then(() => {
                document['_id'] = document.resource.id;
                document.resource['_parentTypes'] = this.config
                    .getParentTypes(document.resource.type);

                return this.db.put(document, { force: true }).then(result => {

                    document['_rev'] = result['rev'];
                    return Promise.resolve(this.cleanDoc(document));

                }).catch(err => {

                    let errType = DatastoreErrors.GENERIC_SAVE_ERROR;
                    if (err.name && err.name == 'conflict')
                        errType = DatastoreErrors.SAVE_CONFLICT;
                    reset(document);
                    return Promise.reject([errType]);

                })
            },
            () => {
                return Promise.reject([DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR]);
            }
        );
    }

    private resetDocOnErr(original: Document) {
        let created = original.created;
        let modified = original.modified;
        let id = original.resource.id;
        return function(document: Document) {
            delete document['_id'];
            delete document.resource['_parentTypes'];
            document.resource.id = id;
            document.created = created;
            document.modified = modified;
        }
    }

    /**
     * Implements {@link ReadDatastore#refresh}.
     *
     * @param doc
     * @returns {Promise<Document>}
     */
    public refresh(doc: Document): Promise<Document> {
        return this.fetchObject(doc.resource.id)
            .then(doc => this.cleanDoc(doc));
    }

    /**
     * Implements {@link ReadDatastore#get}.
     *
     * @param resourceId
     * @returns {Promise<Document>}
     */
    public get(resourceId: string): Promise<Document> {
        return this.fetchObject(resourceId)
            .then(doc => this.cleanDoc(doc));
    }

    /**
     * Implements {@link Datastore#remove}.
     *
     * @param doc
     * @returns {Promise<undefined>}
     */
    public remove(doc: Document): Promise<undefined> {

        if (doc.resource.id == null) {
            return <any> Promise.reject([DatastoreErrors.DOCUMENT_NO_RESOURCE_ID]);
        }

        return this.get(doc.resource.id).then(
            () => this.db.remove(doc)
                .catch(() => Promise.reject([DatastoreErrors.GENERIC_DELETE_ERROR])),
            () => Promise.reject([DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR])
        );
    }

    public getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument> {
        return this.fetchRevision(docId, revisionId)
            .then(doc => this.cleanDoc(doc));
    }

    public getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>> {
        return this.db.get(docId, { revs_info: true })
            .then(doc => Promise.resolve(doc._revs_info));
    }

    public removeRevision(docId: string, revisionId: string): Promise<any> {

        return this.db.remove(docId, revisionId)
            .catch(err => {
                console.error(err);
                return Promise.reject([M.DATASTORE_GENERIC_ERROR]);
            });
    }

    public shutDown(): Promise<void> {
        return this.db.destroy();
    }

    public documentChangesNotifications(): Observable<Document> {

        return Observable.create(observer => {
            this.observers.push(observer);
        });
    }

    public findIds(query: Query): Promise<string[]> {

        if (!query) return Promise.resolve([]);

        return this.perform(query)
            .catch(err => {
                console.error(err);
                return Promise.reject([M.DATASTORE_GENERIC_ERROR]);
            })
    }

    private hasUsableConstraints(query) {

        if (!query.constraints) return false;

        let validConstraints = 0;
        for (let constraint in query.constraints) {
            if (!this.pouchdbManager.getIndexCreator().hasIndex(constraint)) {
                console.warn('ignoring unknown constraint',constraint);
                delete query.constraints[constraint];
            } else validConstraints++;
        }
        return (validConstraints > 0);
    }

    private perform(query) {

        let hasUsableConstraints = false;
        let startWith = Promise.resolve(undefined);
        if (this.hasUsableConstraints(query)) {
            hasUsableConstraints = true;
            startWith = this.performConstraintQueries(query);
        }

        let theResultSets: ResultSets = new ResultSets();

        return startWith
            .then(resultSets => {
                if (resultSets) theResultSets = resultSets;
                if (!PouchdbDatastore.canSkipSimpleQuery(query,hasUsableConstraints)) {
                    return this.performSimpleQuery(query)
                }
            })
            .then(resultSet => {
                if (resultSet) theResultSets.add(resultSet);

                return theResultSets.intersect('id').sort(this.comp('date')).map(r => r['id']);
            });
    }

    private comp(sortOn) {
        return ((a,b)=> {
            if (a[sortOn] > b[sortOn])
                return -1;
            if (a[sortOn] < b[sortOn])
                return 1;
            return 0;
        });
    }

    /**
     * If usable constraints are there, an empty query can be skipped. This is because
     * the resultsSet of a simpleQuery for an emtpy query would return all existing ids, which means an
     * intersection with the previous resultSets would make no difference.
     */
    private static canSkipSimpleQuery(query, hasUsableConstraints) {
        return ((!query.q || query.q == '') && !query.type && hasUsableConstraints);
    }

    private performConstraintQueries(query): Promise<ResultSets> {

        const ps = [];
        for (let constraint in query.constraints) {
            const opt = {
                reduce: false,
                include_docs: false,
                conflicts: true,
                startkey: ['UNKNOWN'],
                endkey: ['UNKNOWN', {}]
            };
            if (query.constraints[constraint] != undefined) {
                opt['startkey'] = [query.constraints[constraint]];
                opt['endkey'] = [query.constraints[constraint], {}];
            }
            ps.push(this.db.query(constraint, opt));
        }
        return Promise.all(ps).then(results => {

            const resultSets: ResultSets = new ResultSets();
            for (let i in results) {
                resultSets.add(results[i].rows.map(r => {return {id: r.id, date: r.key[1]}}));
            }
            return resultSets;
        });
    }

    private performSimpleQuery(query) {

        const opt = {
            reduce: false,
            include_docs: false,
            conflicts: true,
        };

        let q = query.q ? query.q.toLowerCase() : '';
        let type = query.type ? query.type : '';

        opt['startkey'] = [type, q];

        if (!query.prefix && q == '') query.prefix = true;
        let endKey = query.prefix ? q + '\uffff' : q;
        opt['endkey'] = [type, endKey, {}];

        return this.db.query('fulltext', opt)
            .then(result => {
                return Promise.resolve(
                    this.uniqueIds(result.rows).map(r => {return {id: r.id, date: r.key[2]}})
                );
            });

    }

    public findConflicted(): Promise<IdaiFieldDocument[]> {

        return this.db.query('conflicted', {
            include_docs: true,
            conflicts: true,
            descending: true
        }).then(result => {
            return Promise.resolve(result.rows.map(result=>this.cleanDoc(result.doc)));
        });
    }

    public setupSync(url: string): Promise<SyncState> {

            let fullUrl = url + '/' + this.pouchdbManager.getName();
            console.log('start syncing with ' + fullUrl);

            return this.db.rdy.then(db => {
                let sync = db.sync(fullUrl, { live: true, retry: false });
                this.syncHandles.push(sync);
                return {
                    url: url,
                    cancel: () => {
                        sync.cancel();
                        this.syncHandles.splice(this.syncHandles.indexOf(sync), 1);
                    },
                    onError: Observable.create(obs => sync.on('error', err => obs.next(err))),
                    onChange: Observable.create(obs => sync.on('change', () => obs.next()))
                };
            });
    }

    public stopSync() {

        for (let handle of this.syncHandles) {
            console.debug('stop sync', handle);
            handle.cancel();
        }
        this.syncHandles = [];
    }

    protected setupServer() {
        return Promise.resolve();
    }

    /**
     * @param doc
     * @return resolve when document with the given resource id does not exist already, reject otherwise
     */
    private proveThatDoesNotExist(doc:Document): Promise<any> {
        if (doc.resource.id) {
            return this.fetchObject(doc.resource.id)
                .then(result => Promise.reject(M.DATASTORE_RESOURCE_ID_EXISTS), () => Promise.resolve())
        } else return Promise.resolve();
    }

    private fetchObject(id: string): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.
        return this.db.get(id, { conflicts: true })
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }

    private fetchRevision(docId: string, revisionId: string): Promise<Document> {
        return this.db.get(docId, { rev: revisionId })
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]))
    }

    private docsFromResult(result: any[]): Document[] {
        return result['rows'].map(row => this.cleanDoc(row.doc));
    }

    // strips document of any properties that are only
    // used to simplify index creation
    private cleanDoc(doc: Document): Document {

        if (doc && doc.resource) {
            delete doc.resource['_parentTypes'];
        }
        return doc;
    }

    private uniqueIds(items: any[]): any[] {

        const set: Set<string> = new Set<string>();
        let filtered = [];
        items.forEach(item => {
            if (!set.has(item.id)) {
                set.add(item.id);
                filtered.push(item);
            }
        });
        return filtered;
    }

    private setupChangesEmitter(): void {

        this.db.rdy.then(db => {
            db.changes({
                live: true,
                include_docs: true,
                conflicts: true,
                since: 'now'
            }).on('change', change => {
                if (change && change['id'] && (change['id'].indexOf('_design') == 0)) return; // starts with _design
                if (!change || !change.doc) return;
                if (this.observers && Array.isArray(this.observers)) this.observers.forEach(observer => {
                    if (observer && (observer.next != undefined)) {
                        observer.next(this.cleanDoc(change.doc));
                    }
                });
            }).on('complete', info => {
                console.error('changes stream was canceled', info);
            }).on('error', err => {
                console.error('changes stream errored', err);
            });
        });
    }
}
