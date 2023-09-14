import { clone, equal, flatten, isEmpty, not, to } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, Named, ProjectConfiguration, Relation } from 'idai-field-core';
import { validateReferences } from './validation/validate-references';


export type InputType = {
    name: string;
    label: string;
    searchable?: boolean;
    customFields?: boolean;
};


export type CategoriesFilter = {
    name: string,
    label: string,
    isRecordedInCategory?: string;
};


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export function isParentField(category: CategoryForm, field: Field): boolean {

        if (!category.parentCategory) return false;

        return flatten(category.parentCategory.groups.map(to('fields')))
            .map(Named.toName)
            .includes(field.name);
    }


    export function getCategoriesOrder(topLevelCategoriesArray: Array<CategoryForm>): string[] {

        return topLevelCategoriesArray.reduce((order, category) => {
            order.push(category.name);
            if (category.children) order = order.concat(category.children.map(to(Named.NAME)));
            return order;
        }, []);
    }


    export function getInputTypeLabel(inputTypeName: string, availableInputTypes: Array<InputType>): string {

        return availableInputTypes
            .find(inputType => inputType.name === inputTypeName)
            .label;
    }


    export function filterTopLevelCategories(topLevelCategories: Array<CategoryForm>,
                                             filter: CategoriesFilter,
                                             projectConfiguration: ProjectConfiguration): Array<CategoryForm> {

        return topLevelCategories.filter(category => {
            switch (filter.name) {
                case 'all':
                    return true;
                case 'images':
                    return category.name === 'Image';
                case 'types':
                    return ['Type', 'TypeCatalog'].includes(category.name);
                default:
                    return filter.isRecordedInCategory
                        ? Relation.isAllowedRelationDomainCategory(
                            projectConfiguration.getRelations(),
                            category.name,
                            filter.isRecordedInCategory,
                            Relation.Hierarchy.RECORDEDIN
                        )
                        : !projectConfiguration.getRelationsForDomainCategory(category.name)
                                .map(to('name')).includes(Relation.Hierarchy.RECORDEDIN)
                            && !['Image', 'Type', 'TypeCatalog'].includes(category.name);
            }
        });
    }


    /**
     * @throws M.CONFIGURATION_ERROR_INVALID_REFERENCE if validation fails
     */
    export function cleanUpAndValidateReferences(object: any) {

        object.references = object.references.filter(not(isEmpty));
        validateReferences(object.references);

        if (isEmpty(object.references)) delete object.references;
    }


    export function isReferencesArrayChanged(object: any, editedObject: any): boolean {

        const originalReferences: string[] = object.references
            ? clone(object.references).filter(not(isEmpty))
            : [];
        
        const editedReferences: string[] = editedObject.references
            ? clone(editedObject.references).filter(not(isEmpty))
            : [];

        return !equal(originalReferences)(editedReferences);
    }


    export function updateValuelists(configurationDocument: ConfigurationDocument,
                                     changedConfigurationDocument: ConfigurationDocument) {

        configurationDocument._rev = changedConfigurationDocument._rev;
        configurationDocument.created = changedConfigurationDocument.created;
        configurationDocument.modified = changedConfigurationDocument.modified;
        configurationDocument.resource.valuelists = changedConfigurationDocument.resource.valuelists;
    }
}
