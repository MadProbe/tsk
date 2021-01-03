import { Tokens } from "../enums";
declare type Streamable = {
    [index: number]: any;
};
declare type ValueType<A extends Streamable> = A extends {
    [index: number]: infer P;
} ? P : never;
export interface ValueStream<T extends Streamable> {
    next: ValueType<T>;
    move(): ValueType<T>;
    down(): ValueType<T>;
}
export declare type TextStream = ValueStream<string>;
export declare type TokenStream = ValueStream<TokenList>;
export declare type Token = [Tokens, string, ...string[]];
export declare type TokenList = Token[];
/**
 * @template {import("./stream").Streamable} T
 * @param {T} streamable
 * @returns {T}
 */
export declare function Stream<T extends Streamable>(streamable: T): ValueStream<T>;
export {};
