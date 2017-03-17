import {browser,protractor,element,by} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';

let resourcesPage = require('./resources.page');
let documentViewPage = require('../widgets/document-view.page');
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('resources', function() {


    beforeEach(function(){
        resourcesPage.get();
    });

    it('should find it by its identifier', function() {
        resourcesPage.performCreateResource('1');
        resourcesPage.typeInIdentifierInSearchField('1');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('1')),delays.ECWaitTime);
    });

    it ('should show only resources of the selected type', function() {
        resourcesPage.performCreateResource('1', 0);
        resourcesPage.performCreateResource('2', 1);
        resourcesPage.clickChooseTypeFilter(2);
        resourcesPage.clickChooseTypeFilter(1);
        browser.wait(EC.stalenessOf(resourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('2')), delays.ECWaitTime);
        resourcesPage.clickChooseTypeFilter(0);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(resourcesPage.getListItemEl('2')), delays.ECWaitTime);
        resourcesPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('2')), delays.ECWaitTime)
    });

    it ('should reflect changes in overview in realtime', function() {
        resourcesPage.performCreateResource('1a');
        resourcesPage.performCreateResource('2');
        resourcesPage.clickSelectResource('1a');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('1b');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('1b')), delays.ECWaitTime);
    });

    /**
     * Addresses a bug which caused that a freshly created object
     * was not the same instance in the document edit and the overview component anymore
     * so that changes made to one would not be reflected in the other.
     *
     * This however did not happen with an object already saved.
     */
    it ('should reflect changes in overview after creating object - first scenario', function() {
        resourcesPage.performCreateResource('12');
        DocumentEditWrapperPage.typeInIdentifier('34');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('34')), delays.ECWaitTime);
    });


    /**
     * Addresses a bug where a call on datastore.find led to detached documents in the resource overview.
     * The instances didn't reflect the state of the db and vice versa because they were different instances.
     */
    it ('should reflect changes in overview after creating object - second scenario', function() {
        resourcesPage.performCreateResource('12');
        resourcesPage.clickChooseTypeFilter(0); // calls find
        resourcesPage.clickSelectResource('12');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('56'); // same ...
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('56')), delays.ECWaitTime); // ... instance
    });


    /**
     * There has been a bug where this was not possible.
     * The attempt to do so got rejected with the duplicate identifier message.
     */
    it ('should save a new object and then save it again', function() {
        resourcesPage.performCreateResource('1');
        DocumentEditWrapperPage.clickSaveDocument();
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    /**
     * There has been a bug where this was not possible due to a faulty datastore implementation.
     */
    it ('should restore a document properly', function() {
        resourcesPage.performCreateResource('old');
        resourcesPage.performCreateResource('2');
        resourcesPage.clickSelectResource('old');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('new');
        resourcesPage.clickSelectResource('2');
        resourcesPage.clickDiscardInModal();
        expect(resourcesPage.getListItemIdentifierText(1)).toEqual('old');
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of 'Neues Objekt' for every time the button was pressed.
     */
    it('should remove a new object from the list if it has not been saved', function() {
        resourcesPage.performCreateResource('1');
        resourcesPage.clickCreateObject();
        resourcesPage.clickSelectResourceType();
        resourcesPage.clickSelectGeometryType();
        resourcesPage.clickCreateObject();
        resourcesPage.clickSelectResourceType();
        resourcesPage.clickSelectGeometryType();
        browser.wait(EC.presenceOf(resourcesPage.getListItemMarkedNewEl()), delays.ECWaitTime);
        resourcesPage.scrollUp();
        resourcesPage.clickSelectResource('1');
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('1');
    });

    it ('should change the selection to new when saving via modal', function() {
        resourcesPage.performCreateResource('1');
        resourcesPage.clickSelectResource('1');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('2');
        resourcesPage.clickCreateObject();
        resourcesPage.clickSelectResourceType();
        resourcesPage.clickSelectGeometryType();
        resourcesPage.scrollUp();
        resourcesPage.clickSaveInModal();
        resourcesPage.scrollUp();
        browser.wait(EC.presenceOf(element(by.css('#objectList .list-group-item .new'))), delays.ECWaitTime);
        element(by.css('#objectList .list-group-item .new')).getText().then(text => {
            expect(text).toEqual('Neues Objekt');
        });
        
    });

    it ('should change the selection to existing when saving via modal', function() {
        resourcesPage.performCreateResource('1');
        resourcesPage.performCreateResource('2');
        resourcesPage.clickSelectResource('2');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('2a');
        resourcesPage.clickSelectResource('1');
        resourcesPage.scrollUp();
        resourcesPage.clickSaveInModal();
        resourcesPage.scrollUp();
        expect(resourcesPage.clickSelectObjectByIndex(1).getAttribute('class')).toContain('selected')
    });

    it ('should not change the selection to existing when cancelling in modal', function() {
        resourcesPage.performCreateResource('1');
        resourcesPage.performCreateResource('2');
        resourcesPage.clickSelectResource('2');
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInIdentifier('2a');
        resourcesPage.clickSelectResource('1');
        resourcesPage.scrollUp();
        resourcesPage.clickCancelInModal();
        resourcesPage.scrollUp();
        expect(resourcesPage.clickSelectObjectByIndex(0).getAttribute('class')).toContain('selected');
    });

    it('should delete a resource', function() {
        resourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('1')), delays.ECWaitTime);
        resourcesPage.clickSelectResource('1');
        documentViewPage.clickEditDocument();
        resourcesPage.clickDeleteDocument();
        resourcesPage.clickDeleteInModal();
        browser.wait(EC.stalenessOf(resourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });
});
