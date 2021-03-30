import {clone as tsfunClone} from 'tsfun';


export function jsonClone(x: any) { return JSON.parse(JSON.stringify(x)); }


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function clone<T>(struct: T): T {

    return tsfunClone(struct, (item: any) => {
        return item instanceof Date
            ? new Date(item)
            : jsonClone(item);
    });
}