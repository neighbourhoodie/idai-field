import {ValuelistDefinition} from './valuelist-definition';


/**
 * @author Daniel de Oliveira
 */
export interface FieldDefinition { // TODO rename to Field (and RelationDefinition to Relation, for consistency with Category and Group

    name: string;
    inputType: FieldDefinition.InputType,
    label: string;

    group: string;
    description?: string;
    valuelist?: ValuelistDefinition;
    valuelistFromProjectField?: string;
    editable?: boolean;                 // defaults to true
    visible?: boolean;                  // defaults to true
    mandatory?: true;
    fulltextIndexed?: true;
    constraintIndexed?: true;
    allowOnlyValuesOfParent?: true;
    source?: // TODO make non-optional
        'builtin'
        |'library'
        |'custom'
        |'common';
}


export module FieldDefinition {

    export const INPUTTYPE = 'inputType';
    export const SOURCE = 'source';
    export const VISIBLE = 'visible';
    export const MANDATORY = 'mandatory';
    export const EDITABLE = 'editable';
    export const NAME = 'name';
    export const LABEL = 'label';
    export const DESCRIPTION = 'description';
    export const FULLTEXTINDEXED = 'fulltextIndexed';
    export const CONSTRAINTINDEXED = 'constraintIndexed';
    export const GROUP = 'group';

    export module Source {

        export const BUILTIN = 'builtin';
        export const LIBRARY = 'library';
        export const CUSTOM = 'custom';
        export const COMMON = 'common';
    }

    export type InputType = 'input'
        |'unsignedInt'
        |'unsignedFloat'
        |'float'
        |'text'
        |'multiInput'
        |'dropdown'
        |'dropdownRange'
        |'radio'
        |'boolean'
        |'checkboxes'
        |'dating'
        |'date'
        |'dimension'
        |'literature'
        |'geometry'
        |'instanceOf'
        |'default';

    export module InputType {

        export const INPUT = 'input';
        export const UNSIGNEDINT = 'unsignedInt';
        export const UNSIGNEDFLOAT = 'unsignedFloat';
        export const FLOAT = 'float';
        export const TEXT = 'text';
        export const MULTIINPUT = 'multiInput';
        export const DROPDOWN = 'dropdown';
        export const DROPDOWNRANGE = 'dropdownRange';
        export const RADIO = 'radio';
        export const BOOLEAN = 'boolean';
        export const CHECKBOXES = 'checkboxes';
        export const DATING = 'dating';
        export const DATE = 'date';
        export const DIMENSION = 'dimension';
        export const LITERATURE = 'literature';
        export const GEOMETRY = 'geometry';
        export const DEFAULT = 'default';
    }
}