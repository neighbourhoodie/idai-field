import { PouchDbFactory } from './types';


/**
 * Manages the creation and destruction of PouchDB instances.
 * 
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class PouchdbManager {

    private db: PouchDB.Database;

    public open = true;


    constructor(private pouchDbFactory: PouchDbFactory) {}


    public getDb = (): PouchDB.Database => this.db;

    /**
     * Destroys the db named dbName, if it is not the currently selected active database
     * @throws if trying do delete the currently active database
     */
    public destroyDb = (dbName: string) => this.pouchDbFactory(dbName).destroy();


    public createDb_e2e(dbName: string) {
     
        this.db = this.pouchDbFactory(dbName);
        this.open = true;
        return this.db;
    }


    /**
     * Creates a new database. Unless specified specifically
     * with destroyBeforeCreate set to true,
     * a possible existing database with the specified name will get used
     * and not overwritten.
     */
    public async createDb(name: string, doc: any, destroyBeforeCreate: boolean): Promise<PouchDB.Database> {

        let db = this.pouchDbFactory(name);

        if (destroyBeforeCreate) {
            await db.destroy();
            db = this.pouchDbFactory(name);
        }

        try {
            await db.get('project');
        } catch {
            // create project only if it does not exist,
            // which can happen if the db already existed
            await db.put(doc);
        }

        this.db = db;
        this.open = true;

        return db;
    }

    
    public close() {
        if (this.db) {
            this.db.close();
        }
        this.open = false;
    }
}
