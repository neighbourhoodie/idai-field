import {
    copy, Pair, reduce, ObjectCollection, to, range, map, val, identity,
    isDefined, convertPath, isString, getOn, dissoc
} from 'tsfun';

// @author Daniel de Oliveira


export function startsWith(with_: string) { return (what: string) => what.startsWith(with_)}

export function longerThan(than: string) { return (what: string) => what.length > than.length }

export function includes(it: string) { return (what: string) => what.includes(it) }

export function isEmptyString(a: any) { return typeof a === 'string' && a === '' }

export function typeOf(v: any) { return typeof v }

export function debugId<T>(v: T): T {

    console.log("debug:", v);
    return v;
}


export function split(pattern: any) {

    return (content: string) => content.split(pattern);
}


export function join(pattern: any) {

    return <A>(content: Array<A>): string => content.join(pattern);
}


export function toLowerCase(s: string) {

    return s.toLowerCase();
}


export function toArray(token: any) {

    return Array.from(token);
}


export function convertToArray(a: any) {

    return [a];
}


/**
 * to be used with reduce
 */
export function withDissoc(struct: any, path: string) {

    return dissoc(path)(struct);
}
// return map(val(undefined))(range(size));


/**
 * path: 'd.e'
 * as: [{ d: { e: 17 }}, { d: { e: 19 }}]
 * ->
 * { 17: { d: { e: 17 }}, 19: { d: { e: 19 }}}
 */
export function makeLookup(path: string) {

    return <A>(as: Array<A>): ObjectCollection<A> =>
        assocReduce((a: A) => [getOn(path)(a), a], {})(as);
}


/**
 * target: { a: 2, b: 3 }
 * source: [['a', 17]]
 * ->
 * { a: 17, b: 3 }
 */
export function replaceIn<T>(target: ObjectCollection<T>): (source: Array<Pair<string, T>>) => ObjectCollection<T>;
export function replaceIn<T>(target: Array<T>): (source: Array<Pair<number, T>>) => Array<T>;
export function replaceIn<T>(target: ObjectCollection<T>|Array<T>) {

    return assocReduce(identity as any, target as ObjectCollection<T>) as any;
}


/**
 * source: ['c','d']
 * target: {}
 * f: a => [a, a + a]
 * ->
 * { c: 'cc', d: 'dd'}
 */
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [number, T], target: Array<T>)
    : (source: Array<A>|ObjectCollection<A>) => Array<T>;
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [string, T], target: ObjectCollection<T>)
    : (source: Array<A>|ObjectCollection<A>) => ObjectCollection<T>;
export function assocReduce<T,A>(f: (a: A, i?: number|string) => [string|number, T], target: ObjectCollection<T>|Array<T>) {

    return reduce((copied: ObjectCollection<T>, a: A, i: number|string) => {
            const [k1, v1] = f(a, i);
            copied[k1] = v1;
            return copied;
        },
        /* we do not modify target in place */
        copy(target as any) as any) as (source: Array<A>|ObjectCollection<A>) => ObjectCollection<T>;
}


/** experimental */
export function objectReduce<T,A>(f: (acc: ObjectCollection<T>, a: A, i?: string|number) => void, target: ObjectCollection<T>) {

    return reduce(
        (acc: ObjectCollection<T>, a: A, i?: string|number) => { f(acc, a, i); return acc; },
        copy(target as ObjectCollection<T>));
}


export function pick<T>(struct: ObjectCollection<T>, targetId: string): T;
export function pick<A>(as: Array<A>, targetId: number): A;
export function pick<A>(struct: ObjectCollection<A>|Array<A>, targetId: string|number): A  {

    const result = (struct as any)[targetId];
    if (!result) throw 'assertion violation - given key/index does not exist on associative';
    return result as A;
}


/**
 * keys = ['a', 'b']
 * o = { a: 1, b: 2, c: 3 }
 * ->
 * [1, 2]
 */
export function toTuple(...keys: string[]) { // do not remove, even if not used currently

    return <T>(o: ObjectCollection<T>) => keys.map(k => to(k)(o));
}


export function toPair<T>(k1: string, k2: string) {

    return (o: ObjectCollection<T>): Pair<T, T> => [o[k1], o[k2]];
}


export const intoObj = <T>(keyName: string, valName: string) =>
    (object: ObjectCollection<T>, item: ObjectCollection<T>) =>
        isDefined(item[keyName])
            ? (object[((item[keyName]) as any).toString()] = item[valName], object)
            : object;


export function setOn(object: any, path: string) {

    return (val: any): void => _setOn(object, convertPath(path), val);
}


/**
 * if o has not already a value at path, it sets it to alternative
 */
export function takeOrMake<T>(o: T, path: string, alternative: any) {

    return setOn(o, path)(getOn(path , alternative)(o));
}


function _setOn(object: any, path: Array<string|number>, val: any) {

    const key = path[0];

    if (path.length === 1) {
        object[key] = val;
    } else {
        path.shift();
        if (!object[key]) {
            object[key] = isString(key)
                ? {}
                : [];
        }
        _setOn(object[key], path, val);
    }
}
