import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {DoceditImageTabPage} from '../docedit/docedit-image-tab.page';
import {ThumbnailViewPage} from '../widgets/thumbnail-view.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {MapPage} from '../map/map.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 4);
        ResourcesPage.performJumpToTrenchView('S1');
    });


    beforeEach(async done => {

        if (i > 0) {
            MenuPage.navigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickReturnToResourcesTabs();
            NavbarPage.clickTab('project');
            browser.sleep(delays.shortRest * 3);
            ResourcesPage.performJumpToTrenchView('S1');
        }

        i++;
        done();
    });


    function gotoImageTab() {

        MenuPage.navigateToImages();
        NavbarPage.clickReturnToResourcesTabs();
        NavbarPage.clickTab('project');

        ResourcesPage.performJumpToTrenchView('S1');
        ResourcesPage.openEditByDoubleClickResource('SE0');
        // DoceditPage.clickImagesTab(); TODO remove
        DoceditPage.clickGotoImagesTab();
    }


    function addTwoImages() {

        // gotoImageTab();
        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();
        DoceditImageTabPage.clickInsertImage();

        DoceditImageTabPage.waitForCells();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }


    it('messages -- create a new resource of first listed type ', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('messages -- show the success message after saving via modal', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.openEditByDoubleClickResource('12');
        DoceditPage.typeInInputField('identifier', '34');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        NavbarPage.clickCloseAllMessages();
    });


    it('messages -- warn if identifier is missing', () => {

        browser.sleep(5000);

        ResourcesPage.performCreateResource('', 'feature',
            'processor', 'p', undefined,
            false, false);

        NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        NavbarPage.awaitAlert('Bezeichner', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages -- warn if an existing identifier is used', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false, false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages -- do not warn if two different identifiers start with the same string', () => {

        ResourcesPage.performCreateResource('120',undefined,undefined,
            undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false, false);

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    xit('docview -- show the relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Aufgenommen in Maßnahme');
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('S1');
        });
        RelationsViewPage.getRelationName(1).then(value => {
            expect(value).toBe('Zeitlich nach');
        });
        RelationsViewPage.getRelationValue(1).then(value => {
            expect(value).toBe('2');
        });
    });


    /**
     * Addresses an issue where relations were shown double.
     */
    xit('docview -- show only relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(2);
        });
    });


    xit('docview -- show the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'processor', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFieldName(0).then(value => {
            expect(value).toBe('Bearbeiter/Bearbeiterin'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0).then(value => {
            expect(value).toBe('100');
        });
    });


    /**
     * Addresses an issue where fields were shown double.
     */
    xit('docview -- show only the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'processor', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFields().then(items => {
            expect(items.length).toBe(1);
        });
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    xit('docview -- do not show new relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickGotoTimeTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(0);
        DoceditRelationsTabPage.typeInRelationByIndices(0, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(0, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar'))), delays.ECWaitTime);
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(1);
        });
    });


    xit('docedit/images -- create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });


    xit('docedit/images -- delete links to one image', done => {

        addTwoImages();

        gotoImageTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(1);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(1);
            done();
        });
    });


    xit('docedit/images -- delete links to two images', done => {

        addTwoImages();
        gotoImageTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.getCells().get(1).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(0);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(0);
            done();
        });
    });


    xit('delete a resource', () => {

        ResourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        ResourcesPage.clickOpenContextMenu('1');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('1');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    xit('delete an operation and update navbar', () => {

        NavbarPage.clickTab('project');
        ResourcesPage.performJumpToTrenchView('S1');
        NavbarPage.clickTab('project');

        browser.wait(EC.presenceOf(NavbarPage.getTab('resources', 't1')),
            delays.ECWaitTime);

        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('S1');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        NavbarPage.clickCloseAllMessages();

        browser.wait(EC.stalenessOf(NavbarPage.getTab('resources', 't1')),
            delays.ECWaitTime);
    });


    it('find a resource by its identifier', () => {

        ResourcesPage.performCreateResource('1');
        SearchBarPage.typeInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    xit('do not reflect changes in list while editing resource', () => {

        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1a');
        });
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    xit('docedit/savedialog -- save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('2');
        });
    });


    xit('docedit/savedialog -- discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1');
        });
    });


    xit('docedit/savedialog -- cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    xit('relations -- create links for relations', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationValue(1).then(relVal => expect(relVal).toEqual('2'));
        RelationsViewPage.clickRelation(1);
        RelationsViewPage.getRelationValue(1).then(relVal => expect(relVal).toEqual('1'));
    });


    xit('relations -- create a new relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickGotoTimeTab();
        expect(DoceditRelationsTabPage.getRelationButtonText(1, 0, 0))
            .toEqual('1');
        DoceditPage.clickCloseEdit();

        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();

        DoceditPage.clickGotoTimeTab();
        expect(DoceditRelationsTabPage.getRelationButtonText(2, 0, 0))
            .toEqual('2');
        DoceditPage.clickCloseEdit();
    });


    xit('relations -- edit a resource that contains a relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        //DoceditPage.clickFieldsTab(); TODO remove function
        DoceditPage.typeInInputField('identifier', '123');
        DoceditPage.clickSaveDocument();
        // TODO expectation?
    });


    xit('relations -- delete a relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickGotoTimeTab();

        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(1, 0);
        DoceditPage.clickSaveDocument();
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
    });


    xit('relations -- delete inverse relations when deleting a resource', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickOpenContextMenu('2');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
    });


    xit('operation -- create a new operation', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.performCreateOperation('newTrench');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toEqual('newTrench'));
    });


    xit('operation -- should edit an operation and update navbar', () => {

        NavbarPage.clickTab('project');
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toEqual('S1'));

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        NavbarPage.getTabLabel('resources', 't1').then(label => {
            expect(label).toEqual('newIdentifier');
        });
    });


    xit('typechange -- should change the type of a resource to a child type', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Architektur'));
    });


    xit('typechange -- should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();

        DoceditPage.clickGotoPropertiesTab();
        DoceditPage.clickSelectOption('wallType', 1);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        FieldsViewPage.getFieldValue(0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Stratigraphische Einheit'));
        browser.wait(EC.stalenessOf(FieldsViewPage.getFieldElement(0)));
    });


    xit('hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });


    xit('remove new resource from list if docedit modal is canceled during resource creation', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        MapPage.clickMapOption('ok');
        DoceditPage.clickCloseEdit();
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(0));
    });


    xit('duplicate a resource', () => {

        ResourcesPage.performCreateResource('resource1', 'feature');
        ResourcesPage.openEditByDoubleClickResource('resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource3')), delays.ECWaitTime);
    });


    xit('create two instances of a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', 'resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
    });


    xit('move a resource', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S2');
        ResourcesPage.clickResourceListItemInMoveModal('S2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toEqual('S2'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(6));

        NavbarPage.clickTab('project');
        ResourcesPage.performJumpToTrenchView('S1');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    xit('show only type filter options for allowed parent types in move modal', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(8);
            expect(labels[0].getText()).toEqual('Schnitt');
            expect(labels[1].getText()).toEqual('Stratigraphische Einheit');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();

        NavbarPage.clickTab('project');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(1);
            expect(labels[0].getText()).toEqual('Ort');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();
    });


    xit('do not suggest current parent resource in move modal', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('trench', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
           for (let label of labels) expect(label.getText()).not.toEqual('S1');
        });
        ResourcesPage.clickCancelInMoveModal();

        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenContextMenu('testf1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('SE0');
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    xit('do not suggest descendants of current resource in move modal', () => {

        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.performCreateResource('SE-D1', 'feature');
        ResourcesPage.clickHierarchyButton('SE-D1');
        ResourcesPage.performCreateResource('SE-D2', 'feature');

        ResourcesPage.clickOperationNavigationButton();
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) {
                expect(label.getText()).not.toEqual('SE-D1');
                expect(label.getText()).not.toEqual('SE-D2');
            }
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    xit('do not open context menu for new resources while creating geometry', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.clickOpenContextMenu('SE0');
        browser.wait(EC.presenceOf(ResourcesPage.getContextMenu()), delays.ECWaitTime);
        ResourcesPage.clickOpenContextMenu('undefined');
        browser.wait(EC.stalenessOf(ResourcesPage.getContextMenu()), delays.ECWaitTime);
        MapPage.clickMapOption('abort');
    })
});
