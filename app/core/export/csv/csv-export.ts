import {flow, includedIn, isDefined, isNot, isnt, to, map, cond,
    dense, prepend, append, compose, remove} from 'tsfun';
import {FieldResource, Resource} from 'idai-components-2';
import {HierarchicalRelations} from '../../model/relation-constants';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {CsvExportUtils} from './csv-export-utils';
import {CsvExportConsts, Heading, HeadingsAndMatrix, M} from './csv-export-consts';
import OBJECT_SEPARATOR = CsvExportConsts.OBJECT_SEPARATOR;
import RELATIONS_IS_CHILD_OF = CsvExportConsts.RELATIONS_IS_CHILD_OF;
import ARRAY_SEPARATOR = CsvExportConsts.ARRAY_SEPARATOR;
import {CSVMatrixExpansion} from './csv-matrix-expansion';
import {join} from '../../util/utils';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    const SEPARATOR = ',';

    const getUsableFieldNames =
        remove(includedIn(['id', 'type', 'geometry', 'georeference', 'originalFilename', 'filename']));


    /**
     * Creates a header line and lines for each record.
     * If resources is empty, still a header line gets created.
     *
     * @param resources
     * @param fieldDefinitions
     * @param relations
     */
    export function createExportable(resources: Array<FieldResource>,
                                     fieldDefinitions: Array<FieldDefinition>,
                                     relations: Array<string>) {

        const headings: string[] = makeHeadings(fieldDefinitions, relations);
        const matrix = resources
            .map(CsvExportUtils.convertToResourceWithFlattenedRelations)
            .map(toRowsArrangedBy(headings));

        return flow([headings, matrix],
            CSVMatrixExpansion.expandValOptionalEndVal(fieldDefinitions),
            CSVMatrixExpansion.expandDating,
            CSVMatrixExpansion.expandDimension(fieldDefinitions),
            combine);
    }


    function combine([headings, matrix]: HeadingsAndMatrix) {

        return [headings].concat(matrix).map(toCsvLine);
    }


    function makeHeadings(fieldDefinitions: Array<FieldDefinition>, relations: string[]) {

        return makeFieldNamesList(fieldDefinitions)
            .concat(
                relations
                    .filter(isNot(includedIn(HierarchicalRelations.ALL)))
                    .map(prepend(Resource.RELATIONS + OBJECT_SEPARATOR)))
            .concat(relations.find(includedIn(HierarchicalRelations.ALL)) ? [RELATIONS_IS_CHILD_OF] : []);
    }


    function toRowsArrangedBy(headings: Heading[]) {

        return (resource: FieldResource) => {

            return getUsableFieldNames(Object.keys(resource))
                .reduce((row, fieldName) => {

                   const indexOfFoundElement = headings.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) row[indexOfFoundElement] = (resource as any)[fieldName];

                    return row;

                }, dense(headings.length));
        }
    }


    // TODO reimplement
    function makeFieldNamesList(fieldDefinitions: Array<FieldDefinition>): string[] {

        let fieldNames = getUsableFieldNames(fieldDefinitions.map(to(FieldDefinition.NAME)));
        const indexOfShortDescription = fieldNames.indexOf(FieldResource.SHORTDESCRIPTION);
        if (indexOfShortDescription !== -1) {
            fieldNames.splice(indexOfShortDescription, 1);
            fieldNames.unshift(FieldResource.SHORTDESCRIPTION);
        }
        fieldNames = fieldNames.filter(isnt(FieldResource.IDENTIFIER));
        fieldNames.unshift(FieldResource.IDENTIFIER);

        return fieldNames;
    }


    function toCsvLine(fields: string[]): string {

        return flow(
            fields,
            map(
                cond(isDefined,
                    compose(getFieldValue, append('"'), prepend('"')),
                    '""')),
            join(SEPARATOR));
    }


    function getFieldValue(field: any): string {

        const value: string = Array.isArray(field)
            ? field.join(ARRAY_SEPARATOR)
            : field + '';   // Convert numbers to strings

        return value.replace(new RegExp('"', 'g'), '""');
    }
}