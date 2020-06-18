const INITIALIZATION_MESSAGES = {
    'de': {
        'loading1': 'Projekt',
        'loading2': 'wird geladen...',
        'loadTestProject': 'Testprojekt laden',
        'databaseError': 'Ein Fehler ist aufgetreten: Die Projektdatenbank konnte nicht geladen werden.',
        'configurationError': 'Ein Fehler ist aufgetreten: Die Projektkonfiguration konnte nicht geladen werden.',
        'fetchDocumentsError': 'Ein Fehler ist aufgetreten: Die Projektressourcen konnte nicht aus der Datenbank gelesen werden.',
        'indexingError': 'Ein Fehler ist aufgetreten: Die Indizierung der Projektressourcen ist fehlgeschlagen.',
        'oneConfigurationError': 'Fehler in der Projektkonfiguration:',
        'multipleConfigurationErrors': 'Fehler in der Projektkonfiguration:',
        'configuration/error/missingValuelist': 'Für das Feld "[0]" wurde keine Werteliste definiert.',
        'configuration/error/missingFieldName': 'Ein in der Projektkonfiguration definiertes Feld hat keinen Namen.',
        'configuration/error/missingRelationCategory': 'Die in einer Relationsdefinition angegebene Kategorie "[0]" konnte nicht gefunden werden.',
        'configuration/fields/custom/parentNotDefined': 'Die Oberkategorie "[0]" konnte nicht gefunden werden.',
        'configuration/fields/custom/tryingToSubtypeANonExtendableCategory': 'Für die Kategorie "[0]" dürfen keine Unterkategorien angelegt werden.',
        'configuration/fields/custom/commonFieldValuelistFromProjectDocNotToBeOverwritten': 'Für das Feld "[1]" der Kategorie "[0]" darf keine Werteliste gesetzt werden, da die erlaubten Werte der Projektressource entnommen werden.',
        'configuration/buildProjectCategories/duplicationInSelection': 'Für die Kategorie "[0]" wurde mehr als ein Formular gewählt.',
        'configuration/buildProjectCategories/mustHaveParent': 'Für die Kategorie "[0]" muss eine Oberkategorie gewählt werden.',
        'configuration/buildProjectCategories/missingCategoryProperty': 'Die Eigenschaft "[0]" muss für die Kategorie "[1]" gesetzt werden.',
        'configuration/buildProjectCategories/illegalCategoryProperty': 'Die Eigenschaft "[0]" darf für die Kategorie "[1]" nicht gesetzt werden.',
        'configuration/buildProjectCategories/missingFieldProperty': 'Die Eigenschaft "[0]" muss für das Feld "[2]" der Kategorie "[1]" gesetzt werden.',
        'configuration/buildProjectCategories/mustNotSetInputType': 'Die Eigenschaft "inputType" darf für das Feld "[1]" der Kategorie "[0]" nicht geändert werden.',
        'configuration/buildProjectCategories/illegalFieldInputType': 'Der als Eigenschaft "inputType" des Feldes "[1]" gesetzte Wert "[0]" ist ungültig.',
        'configuration/buildProjectCategories/illegalFieldProperty': 'Die Eigenschaft "[1]" ist ungültig.',
        'configuration/buildProjectCategories/noValuelistProvided': 'Für das Feld "[1]" der Kategorie "[0]" wurde keine Werteliste angegeben.',
        'configuration/buildProjectCategories/triedToOverwriteParentField': 'Das in der Kategorie "[1]" definierte Feld "[0]" darf in der Subkategorie "[2]" nicht neu definiert werden.'
    },
    'en': {
        'loading1': 'Loading project',
        'loading2': '...',
        'loadTestProject': 'Load test project',
        'databaseError': 'An error has occurred: The project database could not be loaded.',
        'configurationError': 'An error has occurred: The project configuration could not be loaded.',
        'fetchDocumentsError': 'An error has occurred: The project resources could not be read from the database.',
        'indexingError': 'An error has occurred: The indexing of the project resources has failed.',
        'oneConfigurationError': 'Error in project configuration:',
        'multipleConfigurationErrors': 'Errors in project configuration:',
        'configuration/error/missingValuelist': 'No value list is defined for the field "[0]".',
        'configuration/error/missingFieldName': 'A field defined in the project configuration has no name.',
        'configuration/error/missingRelationCategory': 'The category "[0]" specified in a relation definition could not be found.',
        'configuration/fields/custom/parentNotDefined': 'The supercategory "[0]" could not be found.',
        'configuration/fields/custom/tryingToSubtypeANonExtendableCategory': 'No subcategories may be created for the category "[0]".',
        'configuration/fields/custom/commonFieldValuelistFromProjectDocNotToBeOverwritten': 'No value list may be set for the field "[1]" of the category "[0]" as the allowed values are taken from the project resource.',
        'configuration/buildProjectCategories/duplicationInSelection': '',
        'configuration/buildProjectCategories/mustHaveParent': 'More than one form was selected for the category "[0]".',
        'configuration/buildProjectCategories/missingCategoryProperty': 'The property "[0]" must be set for the category "[1]".',
        'configuration/buildProjectCategories/illegalCategoryProperty': 'The property "[0]" must not be set for the category "[1]".',
        'configuration/buildProjectCategories/missingFieldProperty': 'The property "[0]" must be set for field "[2]" of category "[1]".',
        'configuration/buildProjectCategories/mustNotSetInputType': 'The property "inputType" must not be changed for field "[1]" of category "[0]".',
        'configuration/buildProjectCategories/illegalFieldInputType': 'The value "[0]" set as property "inputType" of field "[1]" is invalid.',
        'configuration/buildProjectCategories/illegalFieldProperty': 'The property "[1]" is invalid.',
        'configuration/buildProjectCategories/noValuelistProvided': 'No value list has been specified for field "[1]" of category "[0]".',
        'configuration/buildProjectCategories/triedToOverwriteParentField': 'The field "[0]" defined in category "[1]" must not be redefined in subcategory "[2]".'
    }
};


export const getMessage = (key: string, locale: string, parameters?: string[]): string|undefined => {

    let message: string = INITIALIZATION_MESSAGES[locale][key];

    if (!message) return undefined;

    if (parameters) {
        for (let i = 0; i < parameters.length; i++) {
            message = message.replace('[' + i + ']', parameters[i]);
        }
    }

    return message;
};
