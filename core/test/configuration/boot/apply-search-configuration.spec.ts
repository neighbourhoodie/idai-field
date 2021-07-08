import { Map } from 'tsfun';
import { applySearchConfiguration } from '../../../src/configuration/boot';
import { LibraryCategoryDefinition, TransientCategoryDefinition } from '../../../src/configuration/model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applySearchConfiguration', () => {

    let categories;
    let t1: LibraryCategoryDefinition;

    beforeEach(() => {

        t1 = {
            categoryName: 'x1',
            commons: [],
            parent: 'x',
            description: { 'de': '' },
            createdBy: '',
            creationDate: '',
            color: 'white',
            valuelists: {},
            groups: [],
            fields: {
                'aField': {}
            }
        } as LibraryCategoryDefinition;

        categories = {
            'T1': t1
        } as Map<LibraryCategoryDefinition>
    });


    it('apply search configuration', () => {

        categories = {
                A: { fields: { a1: {}, a2: {}, a3: {} } } as any
        } ;

        const searchConfiguration = {
            'A': {
                'fulltext': ['a1', 'a3'],
                'constraint': ['a2', 'a3']
            }
        };

        applySearchConfiguration(searchConfiguration)(categories);

        expect(categories['A'].fields['a1'].fulltextIndexed).toBeTruthy();
        expect(categories['A'].fields['a2'].fulltextIndexed).toBeFalsy();
        expect(categories['A'].fields['a3'].fulltextIndexed).toBeTruthy();
        expect(categories['A'].fields['a1'].constraintIndexed).toBeFalsy();
        expect(categories['A'].fields['a2'].constraintIndexed).toBeTruthy();
        expect(categories['A'].fields['a3'].constraintIndexed).toBeTruthy();
    });
});
