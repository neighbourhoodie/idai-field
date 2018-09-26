import {NestedArray, union, uniteObject} from 'tsfun';
import {SimpleIndexItem} from './index-item';
import {clone} from '../../util/object-util';


type IndexItemMap = {[id: string]: SimpleIndexItem};

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ResultSets {

    // Hide constructor on purpose to force usage of make.
    // This way one can not modify the sets directly. One can
    // only start with make or copy and then modify via combine.
    private constructor(

        private addSets: NestedArray<string>,
        private subtractSets: NestedArray<string>,
        private map: IndexItemMap
    ) {}


    public static make(): ResultSets {

        return new ResultSets ([], [], {})
    }


    public isEmpty(): boolean {

        return this.addSets.length === 0 && this.subtractSets.length === 0;
    }


    public containsOnlyEmptyAddSets(): boolean {

        if (this.addSets.length === 0) return false;

        for (let addSet of this.addSets) {
            if (addSet.length > 0) return false;
        }

        return true;
    }


    public combine(indexItems: Array<SimpleIndexItem>, mode: string = 'add'): ResultSets {

        const indexItemsMap = ResultSets.intoObject(indexItems);

        const copy = this.copy();
        copy.map = uniteObject(indexItemsMap)(copy.map);

        if (mode !== 'subtract') copy.addSets.push(Object.keys(indexItemsMap));
        else copy.subtractSets.push(Object.keys(indexItemsMap));

        return copy;
    }


    public collapse(): Array<SimpleIndexItem> {

        const addSetIds: string[] = ResultSets.getIntersecting(this.addSets);

        return this.pickFromMap(
            this.subtractSets.length === 0
                ? addSetIds
                : ResultSets.subtract(addSetIds, union(this.subtractSets))
        );
    }


    public unify(): Array<SimpleIndexItem> {

        return this.pickFromMap(
            union(this.addSets)
        );
    }


    private pickFromMap(ids: string[]) {

        return ids.map(id => this.map[id]);
    }


    private copy(): ResultSets {

        return new ResultSets(
            clone(this.addSets),
            clone(this.subtractSets),
            clone(this.map)
        );
    }


    private static intoObject(indexItems: Array<SimpleIndexItem>) {

        return indexItems
            .reduce((acc: IndexItemMap, item) => (acc[item.id] = item, acc), {});
    }


    private static subtract(ids: string[], idsToSubtract: string[]) {

        return ids.filter(id => !idsToSubtract.includes(id));
    }


    private static getIntersecting(idSets: string[][]) {

        let result: string[] = idSets[0];

        if (idSets.length > 1) {
            result = result.filter(id => {
                for (let idSet of idSets.slice(1)) {
                    if (!idSet.includes(id)) return false;
                }
                return true;
            });
        }

        return result;
    }
}