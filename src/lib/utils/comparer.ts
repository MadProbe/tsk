import { $validIDs } from "./valid-id.js";


const s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export interface MultiValueComparer<T> {
    includes(value: unknown): value is T;
    [Symbol.iterator](): IterableIterator<T>;
}

interface MultiValueComparerConstructor {
    readonly prototype: MultiValueComparer<unknown>;
    new <T extends string | Iterable<unknown>>(values: T): MultiValueComparer<T extends string ? PopulateString<T> : T extends Iterable<infer P> ? P : never>;
}

class $MultiValueComparer<T> {
    protected readonly values: Map<T, true>;
    public constructor(values: Iterable<T> | string) {
        this.values = new Map([...values].map(x => [x as T, true]));
    }
    public includes(value: any): value is T {
        return this.values.has(value);
    }
    public [Symbol.iterator]() {
        return this.values.keys();
    }
}

export const MultiValueComparer = $MultiValueComparer as MultiValueComparerConstructor;

export class ValidCharsComparer extends $MultiValueComparer<string> {
    private validIDs = $validIDs;
    public constructor() {
        super(`$0123456789_${ s }${ s.toLowerCase() }`);
        this.validIDs.splice(0, 6);
        this.init("\uffd7");
    }
    public init(toChar: string) {
        const id = toChar.codePointAt(0)!;
        let deleteCount = 0;
        for (const element of this.validIDs) {
            if (element.length === 2) {
                let [start, end] = element;
                if (end > id) {
                    for (; start <= id;) this.values.set(String.fromCodePoint(start++), true);
                    this.validIDs.splice(0, deleteCount);
                    element[0] = start;
                    return;
                } else {
                    for (; start < end;) this.values.set(String.fromCodePoint(start++), true);
                }
            } else {
                this.values.set(String.fromCodePoint(element[0]), true);
            }
            deleteCount++;
        }
    }
    /**
     * This method is considered safe because it continues initialization of this comparer and re-compares again if char is not in the values map
     */
    public safeIncludes(x: string) {
        return this.values.has(x) || (this.init(x), this.values.has(x));
    }
}

type $PopulateString<S extends string, Cache extends string> = S extends `${ infer C }${ infer R }` ? $PopulateString<R, C | Cache> : Cache;
export type PopulateString<S extends string> = S extends `${ infer C }${ infer R }` ? $PopulateString<R, C> : S;
