import { Injectable } from '@angular/core';
import { Name } from 'idai-field-core';
import { isString } from 'tsfun';
import { M } from '../../components/messages/m';
import { Messages } from '../../components/messages/messages';
import { AppConfigurator } from '../configuration/app-configurator';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { SampleDataLoader } from '../datastore/field/sampledata/sample-data-loader';
import { PouchdbManager } from '../datastore/pouchdb/pouchdb-manager';
import { PouchdbServer } from '../datastore/pouchdb/pouchdb-server';
import { ImageConverter } from '../images/imagestore/image-converter';
import { Imagestore } from '../images/imagestore/imagestore';
import { ImagestoreErrors } from '../images/imagestore/imagestore-errors';
import { InitializationProgress } from '../initialization-progress';
import { SyncService } from '../sync/sync-service';
import { Settings } from './settings';
import { SettingsProvider } from './settings-provider';

const {remote, ipcRenderer} = typeof window !== 'undefined' ? window.require('electron') : require('electron');

// Ordered by Name
export const PROJECT_MAPPING = {
    'abbircella': { prefix: 'AbbirCella', label: 'AbbirCella' },
    'al-ula': { prefix: 'AlUla', label: 'Al Ula' },
    'ayamonte': { prefix: 'Ayamonte', label: 'Ayamonte' },
    'bogazkoy-hattusa': { prefix: 'Boha', label: 'Boğazköy-Ḫattuša' },
    'bourgou': { prefix: 'Bourgou', label: 'Henchir el Bourgu' },
    'campidoglio': { prefix: 'Campidoglio', label: 'Campidoglio' },
    'castiglione': { prefix: 'Castiglione', label: 'Castiglione' },
    'gadara_bm': { prefix: 'Gadara', label: 'Gadara' },
    'kalapodi': { prefix: 'Kalapodi', label: 'Kalapodi' },
    'karthagocircus': { prefix: 'KarthagoCircus', label: 'Karthago Circus' },
    'kephissostal': { prefix: 'Kephissostal', label: 'Kephissostal' },
    'meninx-project': { prefix: 'Meninx', label: 'Meninx' },
    'milet': { prefix: 'Milet', label: 'Milet' },
    'monte-turcisi': { prefix: 'MonTur', label: 'Monte Turcisi' },
    'olympia_sht': { prefix: 'Olympia', label: 'Olympia' },
    'pergamongrabung': { prefix: 'Pergamon', label: 'Pergamon' },
    'postumii': { prefix: 'Postumii', label: 'Postumii' },
    'sudan-heritage': { prefix: 'SudanHeritage', label: 'Sudan Heritage' },
    'selinunt': { prefix: 'Selinunt', label: 'Selinunt' },
    'uruk': { prefix: 'Uruk', label: 'Uruk' }
};


@Injectable()
/**
 * The settings service provides access to the
 * properties of the config.json file. It can be
 * serialized to and from config.json files.
 *
 * It is connected to the imagestore and datastore
 * subsystems which are controlled based on the settings.
 *
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SettingsService {

    constructor(private imagestore: Imagestore,
                private pouchdbManager: PouchdbManager,
                private pouchdbServer: PouchdbServer,
                private messages: Messages,
                private appConfigurator: AppConfigurator,
                private imageConverter: ImageConverter,
                private synchronizationService: SyncService,
                private settingsProvider: SettingsProvider) {
    }


    public async bootProjectDb(settings: Settings, progress?: InitializationProgress): Promise<void> {

        try {

            await this.pouchdbManager.createDb(
                settings.selectedProject,
                SettingsService.createProjectDocument(this.settingsProvider.getSettings()),
                settings.selectedProject === 'test');

            if (settings.isSyncActive) await this.setupSync();

        } catch (msgWithParams) {
            console.error(msgWithParams);
            await progress.setError('databaseError');
            throw msgWithParams;
        }
    }


    private static getConfigurationName(projectName: Name): Name|undefined {

        for (let [name, project] of Object.entries(PROJECT_MAPPING)) {
            if (projectName === name || projectName.startsWith(name + '-')) return project.prefix;
        }

        return undefined;
    }


    /**
     * Sets, validates and persists the settings state.
     * Project settings have to be set separately.
     */
    public async updateSettings(settings_: Settings): Promise<Settings> {

        this.settingsProvider.setSettings(settings_);
        const settings = this.settingsProvider.getSettings();

        if (settings.syncTarget.address) {
            settings.syncTarget.address = settings.syncTarget.address.trim();
            if (!SettingsService.validateAddress(settings.syncTarget.address))
                throw 'malformed_address';
        }

        if (ipcRenderer) ipcRenderer.send('settingsChanged', settings);

        this.pouchdbServer.setPassword(settings.hostPassword);

        return this.imagestore.init(settings)
            .catch((errWithParams: any) => {
                if (errWithParams.length > 0 && errWithParams[0] === ImagestoreErrors.INVALID_PATH) {
                    this.messages.add([M.IMAGESTORE_ERROR_INVALID_PATH, settings.imagestorePath]);
                } else {
                    console.error('Something went wrong with imagestore.setPath', errWithParams);
                }
            })
            .then(() => this.settingsProvider.setSettingsAndSerialize(settings))
            .then(() => settings);
    }


    public async loadConfiguration(configurationDirPath: string): Promise<ProjectConfiguration> {

        try {
            return this.appConfigurator.go(
                configurationDirPath,
                SettingsService.getConfigurationName(this.settingsProvider.getSettings().selectedProject),
                this.settingsProvider.getSettings().languages
            );
        } catch (msgsWithParams) {
            if (isString(msgsWithParams)) {
                msgsWithParams = [[msgsWithParams]];
            } else if (msgsWithParams.length > 0 && isString(msgsWithParams[0])) {
                msgsWithParams = [msgsWithParams];
            }

            msgsWithParams.forEach((msg: any) => console.error('Error in project configuration', msg));
            if (msgsWithParams.length > 1) {
                console.error('Number of errors in project configuration:', msgsWithParams.length);
            }

            throw msgsWithParams;
        }
    }

    public async setupSync() {

        this.synchronizationService.stopSync();

        const settings = this.settingsProvider.getSettings();

        if (!settings.isSyncActive || !settings.dbs || !(settings.dbs.length > 0)) return;
        if (!SettingsService.isSynchronizationAllowed(this.settingsProvider.getSettings().selectedProject)) return;

        this.synchronizationService.init(this.settingsProvider.getSettings());
        return this.synchronizationService.startSync();
    }


    public async addProject(project: Name) {

        await this.settingsProvider.addProjectAndSerialize(project);
    }


    public async selectProject(project: Name) {

        this.synchronizationService.stopSync();
        await this.settingsProvider.selectProjectAndSerialize(project);
    }


    public async deleteProject(project: Name) {

        this.synchronizationService.stopSync();

        await this.pouchdbManager.destroyDb(project);
        await this.settingsProvider.deleteProjectAndSerialize(project);
    }


    public async createProject(project: Name, destroyBeforeCreate: boolean) {

        this.synchronizationService.stopSync();

        await this.selectProject(project);

        await this.pouchdbManager.createDb(
            project,
            SettingsService.createProjectDocument(this.settingsProvider.getSettings()),
            destroyBeforeCreate
        );
    }


    public async loadSampleData(project: string, imagestorePath: string, db: PouchDB.Database) {
        const loader = new SampleDataLoader(this.imageConverter, imagestorePath, Settings.getLocale());
        return loader.go(db, project);
    }


    private static isSynchronizationAllowed(project: string): boolean {

        return project !== undefined && (project !== 'test' || remote.getGlobal('mode') === 'test');
    }


    private static validateAddress(address: any) {

        return (address == '')
            ? true
            : new RegExp('^(https?:\/\/)?([0-9a-z\.-]+)(:[0-9]+)?(\/.*)?$').test(address);
    }


    private static createProjectDocument(settings: Settings): any {

        return {
            _id: 'project',
            resource: {
                category: 'Project',
                identifier: settings.selectedProject,
                id: 'project',
                coordinateReferenceSystem: 'Eigenes Koordinatenbezugssystem',
                relations: {}
            },
            created: { user: settings.username, date: new Date() },
            modified: [{ user: settings.username, date: new Date() }]
        };
    }
}
