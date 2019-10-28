import {Document, Resource} from 'idai-components-2';
import {clone} from '../../../util/object-util';
import {isNot, includedIn} from 'tsfun';


const RECORDED_IN = 'isRecordedIn';

const PROTECTED_FIELDS = ['id', 'identifier', 'relations', 'type'];


/**
 * @author Daniel de Oliveira
 */
export function mergeDocument(into: Document, additional: Document, allowOverwriteRelationsOnMerge: boolean): Document {

    const clonedTarget = clone(into);

    clonedTarget.resource =
        Object.keys(additional.resource)
            .filter(isNot(includedIn(PROTECTED_FIELDS)))
            .reduce((acc: Resource, key: string) => {
                if (additional.resource[key] !== undefined) acc[key] = clone(additional.resource[key]);
                return acc;
            }, clonedTarget.resource);

    if (allowOverwriteRelationsOnMerge) {
        clonedTarget.resource.relations = clone(additional.resource.relations);
        if (clonedTarget.resource.relations
            && into.resource.relations
            && into.resource.relations[RECORDED_IN]) {
            clonedTarget.resource.relations[RECORDED_IN] = clone(into.resource.relations[RECORDED_IN]);
        }
    }
    return clonedTarget;
}
