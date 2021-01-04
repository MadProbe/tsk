import type { Tokens } from "../enums";

type Streamable = {
    [index: number]: any;
};
type ValueType<A extends Streamable> = A extends { [index: number]: infer P; } ? P : never;
export interface ValueStream<T extends Streamable> {
    next: ValueType<T>;
    move(): ValueType<T>;
    down(): ValueType<T>;
}
export type TextStream = ValueStream<string>;
export type TokenStream = ValueStream<TokenList>;
export type Token = [Tokens, string, ...string[]];
export type TokenList = Token[];

/**
 * @template {import("./stream").Streamable} T
 * @param {T} streamable 
 * @returns {T}
 */
export function Stream<T extends Streamable>(streamable: T): ValueStream<T> {
    var __index = 0;
    return {
        next: streamable[0],
        /**@param {any} [__next]*/
        move(__next?: any) {
            __next = streamable[__index++];
            this.next = streamable[__index];
            return __next;
        },
        down() {
            return this.next = streamable[--__index];
        }
    }
}