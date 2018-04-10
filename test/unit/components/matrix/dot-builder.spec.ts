import {IdaiFieldDocument} from 'idai-components-2/field';
import {DotBuilder} from '../../../../app/components/matrix/dot-builder';
import {Static} from '../../static';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('DotBuilder', () => {

    let dotBuilder: DotBuilder;

    beforeAll(() => {

        const mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration',
            ['getColorForType', 'getTextColorForType']);
        mockProjectConfiguration.getColorForType.and.returnValue('#ffffff');
        mockProjectConfiguration.getTextColorForType.and.returnValue('#000000');

        dotBuilder = new DotBuilder(mockProjectConfiguration);
    });


    it('build dot string for simple graph', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];

        const graph: string = dotBuilder.build([feature1, feature2]);

        expect(graph).toMatch('digraph \{' +
            'node \\[style=filled, fontname="Roboto"\\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> feature2 \\[class="is-after-f1".*\\] ' +
            '\}');
    });


    it('build dot string for graph with multiple children', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = Static.iffDoc('Feature 3', 'feature3', 'Feature', 'f3');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];

        const graph: string = dotBuilder.build([feature1, feature2, feature3]);

        expect(graph).toMatch('digraph \{' +
            'node \\[style=filled, fontname="Roboto"\\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            'feature3 \\[id="node-f3".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> \{feature2, feature3\} \\[class="is-after-f1".*\\] ' +
            '\}');
    });


    it('build dot string for diamond formed graph', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = Static.iffDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = Static.iffDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];
        feature2.resource.relations['isAfter'] = ['f4'];
        feature3.resource.relations['isAfter'] = ['f4'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f2', 'f3'];

        const graph: string = dotBuilder.build([feature1, feature2, feature3, feature4]);

        expect(graph).toMatch(
            'digraph \{' +
            'node \\[style=filled, fontname="Roboto"\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            'feature3 \\[id="node-f3".*\\] ' +
            'feature4 \\[id="node-f4".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> \{feature2, feature3\} \\[class="is-after-f1".*\\] ' +
            'feature2 -> feature4 \\[class="is-after-f2".*\\] ' +
            'feature3 -> feature4 \\[class="is-after-f3".*\\] ' +
            '}'
        );
    });


    it('build dot string for graph with isContemporaryWith relations', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = Static.iffDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = Static.iffDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = Static.iffDoc('Feature 5', 'feature5', 'Feature', 'f5');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isAfter'] = ['f5'];

        feature2.resource.relations['isContemporaryWith'] = ['f3', 'f4'];
        feature3.resource.relations['isContemporaryWith'] = ['f2', 'f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f2', 'f3'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature5.resource.relations['isBefore'] = ['f2'];

        const graph: string = dotBuilder.build([
            feature1, feature2, feature3, feature4, feature5
        ]);

        expect(graph).toMatch(
            'digraph \{' +
            'node \\[style=filled, fontname="Roboto"\\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            'feature3 \\[id="node-f3".*\\] ' +
            'feature4 \\[id="node-f4".*\\] ' +
            'feature5 \\[id="node-f5".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> feature2 \\[class="is-after-f1".*\\] ' +
            'feature2 -> feature5 \\[class="is-after-f2".*\\] ' +
            'feature2 -> feature3 \\[dir="none", ' +
            'class="is-contemporary-with-f2 is-contemporary-with-f3".*\\] ' +
            'feature2 -> feature4 \\[dir="none", ' +
            'class="is-contemporary-with-f2 is-contemporary-with-f4".*\\] ' +
            '\{rank=same feature2, feature3, feature4\} ' +
            '\}'
        );
    });


    it('build dot string for complicated graph', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = Static.iffDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = Static.iffDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = Static.iffDoc('Feature 5', 'feature5', 'Feature', 'f5');
        const feature6 = Static.iffDoc('Feature 6', 'feature6', 'Feature', 'f6');
        const feature7 = Static.iffDoc('Feature 7', 'feature7', 'Feature', 'f7');
        const feature8 = Static.iffDoc('Feature 8', 'feature8', 'Feature', 'f8');
        const feature9 = Static.iffDoc('Feature 9', 'feature9', 'Feature', 'f9');
        const feature10 = Static.iffDoc('Feature 10', 'feature10', 'Feature', 'f10');
        const feature11 = Static.iffDoc('Feature 11', 'feature11', 'Feature', 'f11');
        const feature12 = Static.iffDoc('Feature 12', 'feature12', 'Feature', 'f12');
        const feature13 = Static.iffDoc('Feature 13', 'feature13', 'Feature', 'f13');
        const feature14 = Static.iffDoc('Feature 14', 'feature14', 'Feature', 'f14');

        feature1.resource.relations['isAfter'] = ['f2', 'f3', 'f4', 'f5', 'f6'];
        feature2.resource.relations['isAfter'] = ['f7', 'f8'];
        feature5.resource.relations['isAfter'] = ['f9'];
        feature6.resource.relations['isAfter'] = ['f10', 'f11', 'f12'];
        feature8.resource.relations['isAfter'] = ['f13'];
        feature10.resource.relations['isAfter'] = ['f13'];
        feature13.resource.relations['isAfter'] = ['f14'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f1'];
        feature5.resource.relations['isBefore'] = ['f1'];
        feature6.resource.relations['isBefore'] = ['f1'];
        feature7.resource.relations['isBefore'] = ['f2'];
        feature8.resource.relations['isBefore'] = ['f2'];
        feature9.resource.relations['isBefore'] = ['f5'];
        feature10.resource.relations['isBefore'] = ['f6'];
        feature11.resource.relations['isBefore'] = ['f6'];
        feature12.resource.relations['isBefore'] = ['f6'];
        feature13.resource.relations['isBefore'] = ['f8', 'f10'];
        feature14.resource.relations['isBefore'] = ['f13'];

        const graph: string = dotBuilder.build([
            feature1, feature2, feature3, feature4,
            feature5, feature6, feature7, feature8,
            feature9, feature10, feature11, feature12,
            feature13, feature14]);

        expect(graph).toMatch(
            'digraph \{' +
            'node \\[style=filled, fontname="Roboto"\\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            'feature3 \\[id="node-f3".*\\] ' +
            'feature4 \\[id="node-f4".*\\] ' +
            'feature5 \\[id="node-f5".*\\] ' +
            'feature6 \\[id="node-f6".*\\] ' +
            'feature7 \\[id="node-f7".*\\] ' +
            'feature8 \\[id="node-f8".*\\] ' +
            'feature9 \\[id="node-f9".*\\] ' +
            'feature10 \\[id="node-f10".*\\] ' +
            'feature11 \\[id="node-f11".*\\] ' +
            'feature12 \\[id="node-f12".*\\] ' +
            'feature13 \\[id="node-f13".*\\] ' +
            'feature14 \\[id="node-f14".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> \{feature2, feature3, feature4, feature5, feature6\} \\[class="is-after-f1".*\\] ' +
            'feature2 -> \{feature7, feature8\} \\[class="is-after-f2".*\\] ' +
            'feature5 -> feature9 \\[class="is-after-f5".*\\] ' +
            'feature6 -> \{feature10, feature11, feature12\} \\[class="is-after-f6".*\\] ' +
            'feature8 -> feature13 \\[class="is-after-f8".*\\] ' +
            'feature10 -> feature13 \\[class="is-after-f10".*\\] ' +
            'feature13 -> feature14 \\[class="is-after-f13".*\\] ' +
            '\}'
        );
    });


    it('do not make a node a root node if it has a isContemporaryWith relation to a non root node', () => {

        const feature1 = Static.iffDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = Static.iffDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = Static.iffDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = Static.iffDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature3.resource.relations['isAfter'] = ['f4'];

        feature2.resource.relations['isContemporaryWith'] = ['f3'];
        feature3.resource.relations['isContemporaryWith'] = ['f2'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f3'];

        const graph: string = dotBuilder.build([feature1, feature2, feature3, feature4]);

        expect(graph).toMatch(
            'digraph \{' +
            'node \\[style=filled, fontname="Roboto"\\] ' +
            'feature1 \\[id="node-f1".*\\] ' +
            'feature2 \\[id="node-f2".*\\] ' +
            'feature3 \\[id="node-f3".*\\] ' +
            'feature4 \\[id="node-f4".*\\] ' +
            '\{rank=min feature1\} ' +
            'feature1 -> feature2 \\[class="is-after-f1".*\\] ' +
            'feature3 -> feature4 \\[class="is-after-f3".*\\] ' +
            'feature2 -> feature3 \\[dir="none", class="is-contemporary-with-f2 is-contemporary-with-f3".*\\] ' +
            '\{rank=same feature2, feature3\} ' +
            '\}'
        );
    });
});