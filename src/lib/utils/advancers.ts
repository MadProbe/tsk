import { assert_token, nullish } from "./util.js";
import type { Tokens } from "../enums";
import type { TokenStream } from "./stream.js";


export function advance_next<P extends string>(stream: TokenStream, end: string, prefix?: Prefix<P>) {
    const next = stream.advance();
    if (nullish(next)) throw `${ prefix ? `${ prefix } ` : "" }Unexcepted EOF - '${ end }' excepted`;
    return next;
}
export declare type Prefix<P extends string> = string extends P ? string : P extends `${ infer S }${ string } ${ "statment" | "expression" }:` ? S extends Uppercase<S> ? P : never: never;

export function assert_next_token<P extends string>(stream: TokenStream, token_type: Tokens, token_string?: string, prefix?: Prefix<P>, end = token_string!, rest = "") {
    return assert_token(advance_next(stream, end, prefix), token_type, token_string, rest);
}
