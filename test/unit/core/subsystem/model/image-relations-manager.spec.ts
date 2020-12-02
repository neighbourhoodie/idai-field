import {RelationsManager} from '../../../../../src/app/core/model/relations-manager';
import {createApp, setupSyncTestDb} from '../subsystem-helper';
import {DocumentDatastore} from '../../../../../src/app/core/datastore/document-datastore';
import {Imagestore} from '../../../../../src/app/core/images/imagestore/imagestore';
import {doc} from '../../../test-helpers';
import {FieldDocument, toResourceId} from 'idai-components-2';
import {ImageRelationsManager} from '../../../../../src/app/core/model/image-relations-manager';
import {SettingsProvider} from '../../../../../src/app/core/settings/settings-provider';
import {sameset} from 'tsfun';
import {HierarchicalRelations, ImageRelations} from '../../../../../src/app/core/model/relation-constants';
import {Lookup} from '../../../../../src/app/core/util/utils';

const fs = require('fs');


describe('subsystem/image-relations-manager', () => {

    let documentDatastore: DocumentDatastore;
    let persistenceManager: RelationsManager;
    let imagestore: Imagestore;
    let settingsProvider: SettingsProvider;
    let projectImageDir: string;
    let username: string;
    let imageRelationsManager: ImageRelationsManager;


    function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
    }


    async function create(documents: Array<[string, string, Array<string>]|[string, string]>) {

        const documentsLookup: Lookup<FieldDocument> = {}
        const relationsLookup = {};

        for (const [id, type, _] of documents) {
            const d = doc(id, type) as FieldDocument;
            if (type !== 'Image') d.resource.relations = { isRecordedIn: [] };
            relationsLookup[id] = d.resource.relations;
            documentsLookup[id] = d;
        }
        for (const [id, type, targets] of documents) {
            if (targets) {
                if (type === 'Image') relationsLookup[id][ImageRelations.DEPICTS] = targets;

                for (const target of targets) {
                    relationsLookup[target][type === 'Image' ? ImageRelations.ISDEPICTEDIN : HierarchicalRelations.LIESWITHIN] = [id];
                }
            }
        }
        for (const document of Object.values(documentsLookup)) {
            await documentDatastore.create(document, username);
        }
        for (const [id, type, _] of documents) {
            if (type === 'Image') createImageInProjectImageDir(id);
        }
        return documentsLookup;
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore: d,
            relationsManager: p,
            imagestore: i,
            imageRelationsManager: irm,
            settingsProvider: s
        } = await createApp();

        documentDatastore = d;
        persistenceManager = p;
        imagestore = i;
        settingsProvider = s;
        imageRelationsManager = irm;

        username = settingsProvider.getSettings().username;

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        projectImageDir = settingsProvider.getSettings().imagestorePath
            + settingsProvider.getSettings().selectedProject
            + '/';
        fs.mkdirSync(projectImageDir, { recursive: true });
        done();
    });


    it('delete TypeCatalog with images', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(4);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        expect((await documentDatastore.find({})).documents.length).toBe(0);
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type with images', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(4);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['t1']);

        const documents = (await documentDatastore.find({})).documents;
        expect(documents.length).toBe(2);
        expect(sameset(documents.map(toResourceId), ['i1', 'tc1'])).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type and Catalog with same image', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(3);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        const documents = (await documentDatastore.find({})).documents;
        expect(documents.length).toBe(0);
        expect(sameset(documents.map(toResourceId), [])).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to other resources', async done => {

        const documentsLookup = await create(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(5);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        const documents = (await documentDatastore.find({})).documents;
        expect(documents.length).toBe(2);
        expect(sameset(documents.map(toResourceId), ['i2', 'r1'])).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to ancestor resources', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(3);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['t1']);

        const documents = (await documentDatastore.find({})).documents;
        expect(documents.length).toBe(2);
        expect(sameset(documents.map(toResourceId), ['tc1', 'i1'])).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        done();
    });
});
