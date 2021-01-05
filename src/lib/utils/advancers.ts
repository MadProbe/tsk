import type { Token, TokenStream } from "./stream.js";
import { includes } from "./util.js";
import { Tokens } from "../enums";

export function downgrade_next(stream: TokenStream) {
    while (includes([Tokens.Whitespace, Tokens.MultilineComment, Tokens.Comment], stream.down()[0]));
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function next_or_fail<P extends string>(stream: import("./stream.js").TokenStream, end: string, prefix?: Prefix<P>) {
    stream.move();
    var next = stream.next, newlines: number;
    if (!next) {
        throw `${ prefix ? ` ${ prefix }` : "" }Unexcepted EOF - '${ end }' excepted`;
    }
    // __line += newlines = occurrences(next[1], '\n');
    // if (newlines !== 0) {
    //     __column = 0;
    // }
    // __column += next[1].length - next[1].lastIndexOf("\n");
    return next;
}
type Prefix<P extends string> = string extends P ? string : P extends `${ infer _ } ${ "statment" | "expression" }:` ? P : never;
/**
 * @param {import("./utils/stream.js").Token} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function skip_whitespace<P extends string>(next: Token, stream: TokenStream, end: string, prefix?: Prefix<P>) {
    return next[0] === Tokens.Whitespace ? next_or_fail(stream, end, prefix) : next;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */

export function advance_next<P extends string>(stream: TokenStream, end: string, prefix?: Prefix<P>) {
    var _temp: Token;
    while ((_temp = skip_whitespace(next_or_fail(stream, end, prefix), stream, end, prefix))[0] === Tokens.MultilineComment || _temp[0] === Tokens.Comment) {
        var _exec = /\s*internal\:\s*(.+)/.exec(_temp[1]);
        if (_exec) {
            Function(_exec[1])();
        }
    };
    return _temp;
}
