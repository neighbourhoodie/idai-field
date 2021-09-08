import { cleanup, fireEvent, render, RenderAPI, waitFor } from '@testing-library/react-native';
import {
    Category, createCategory, Forest, IdGenerator, Labels, NewDocument, PouchdbDatastore, ProjectConfiguration
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import React from 'react';
import { t2 } from '../../../test_data/test_docs/t2';
import { ConfigurationContext } from '../../contexts/configuration-context';
import LabelsContext from '../../contexts/labels/labels-context';
import { PreferencesContext } from '../../contexts/preferences-context';
import { Preferences } from '../../models/preferences';
import { DocumentRepository } from '../../repositories/document-repository';
import loadConfiguration from '../../services/config/load-configuration';
import { ToastProvider } from '../common/Toast/ToastProvider';
import DocumentAdd from './DocumentAdd';


const navigate = jest.fn();
const category = 'Pottery';

jest.mock('../../repositories/document-repository');
jest.mock('idai-field-core');

const project = 'testdb';

const preferences: Preferences = {
    username: 'testUser',
    currentProject: project,
    languages: ['en'],
    recentProjects: [project],
    projects: {
        [project]: {
            url: '',
            password: '',
            connected: true,
        }
    }
};
const setCurrentProject = jest.fn();
const setUsername = jest.fn();
const setProjectSettings = jest.fn();
const removeProject = jest.fn();

describe('DocumentAdd',() => {
    let repository: DocumentRepository;
    let config: ProjectConfiguration;
    let pouchdbDatastore: PouchdbDatastore;
    let renderAPI: RenderAPI;
    const identifier = 'Test';
    const shortDescription = 'This is a test document';
    const expectedDoc: NewDocument = {
        resource: {
            identifier,
            shortDescription,
            category,
            relations: {
                isRecordedIn: [t2.resource.id]
            },
        },
    };
    
    beforeEach(async() => {
  
        pouchdbDatastore = new PouchdbDatastore((name: string) => new PouchDB(name), new IdGenerator());
        await pouchdbDatastore.createDb(project, { _id: 'project', resource: { id: 'project' } }, true);
        const categories: Forest<Category> = [createCategory('Feature'), createCategory(category)];
        repository = await DocumentRepository.init('testuser', categories, pouchdbDatastore);

        config = await loadConfiguration(pouchdbDatastore, project, preferences.languages, preferences.username);
        renderAPI = render(
            <ToastProvider>
                <PreferencesContext.Provider
                    value={ { preferences, setCurrentProject, setUsername, setProjectSettings, removeProject } }>
                    <LabelsContext.Provider value={ { labels: new Labels(() => ['en']) } }>
                        <ConfigurationContext.Provider value={ config }>
                            <DocumentAdd
                                repository={ repository }
                                parentDoc={ t2 }
                                categoryName={ category }
                                navigation={ { navigate } } />
                        </ConfigurationContext.Provider>
                    </LabelsContext.Provider>
                </PreferencesContext.Provider>
            </ToastProvider>);
    });

    afterEach(async (done) => {
        await pouchdbDatastore.destroyDb(project);
        cleanup();
        done();
        jest.clearAllMocks();
    });

    it('should render component correctly', async () => {
        
        expect(renderAPI.queryByTestId('documentForm')).not.toBe(undefined);
    });

    it('should create a new Document with entered values and correctly set relations field',async () => {

        const { getByTestId } = renderAPI;

        fireEvent.press(getByTestId('groupSelect_stem'));
        fireEvent.changeText(getByTestId('inputField_identifier'),identifier);
        fireEvent.changeText(getByTestId('inputField_shortDescription'),shortDescription);
        await waitFor(() => fireEvent.press(getByTestId('saveDocBtn')));
        
        expect(repository.create).toHaveBeenCalledWith(expectedDoc);
    });
});

