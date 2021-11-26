import { Stream, type TextStream, Token, type TokenStream } from "./utils/stream.js";
import { error_unexcepted_token, includes, nullish, undefined } from "./utils/util.js";
import { Tokens } from "./enums";
import { keywords, validChars, $2charoperators, $3charoperators } from "./utils/constants.js";
import { advance_next, type Prefix } from "./utils/advancers.js";

const numberChars = /[\d\.\-\+]/;
const numberRegex = /^(?:[\-\+]?\d[_\d]*)?(?:\.(\.[\-\+]?)?[\d_]+)?$/m;
const operatorCharsRegex = /^[<>\/*+\-?|&\^!%\.@:=\[\](){};,~#]$/m;
const stringStartRegex = /^'|"$/m;
const whitespaceRegex = /\s/;
export const symbolicCharsRegex = /^[^\s<>\/*+\-?|&\^!%\.@:=\[\]~(){};,"'#]$/m;

function isWhitespace(char: string) {
    return char === "\r" || char === "\n" || char === " " || char === "\t" || char === "\f" || char === "\v";
}

// /**
//  * @param {any[]} array
//  * @param {any} element
//  * @param {number} length
//  */
// function has(array, element, length) {
//     for (let index = 0; index < length; index++) {
//         if (element === array[index]) {
//             return true;
//         }
//     }
//     return false;
// }
/**
 * @param {string} quot
 * @param {import("./utils/stream").TextStream} iter
 */
function scanText(quot: string, iter: TextStream): Token {
    var result = "", last = "", compound = '\\' + quot, next: string;
    while (!nullish(next = iter.next) && (next !== quot || last + next === compound)) {
        last = (iter.advance(), next);
        if (nullish(last)) {
            throw "Unexcepted EOF";
        }
        result += last;
    }
    iter.advance();
    return new Token(Tokens.String, result);
}
/**
 * @param {string} char
 * @param {import("./utils/stream").TextStream} iter
 * @returns {import("./utils/stream").Token}
 */
function scanSymbol(char: string, iter: TextStream): Token {
    var result = char, next: string;
    while (!nullish(next = iter.next) && symbolicCharsRegex.test(next)) {
        result += (iter.advance(), next);
    }
    if (!validChars.test(result)) {
        throw `${ result } is not a valid symbol!`;
    }
    return new Token(~keywords.indexOf(result) ? Tokens.Keyword : Tokens.Symbol, result);
}
/**
 * @param {string} char
 * @param {import("./utils/stream").TextStream} iter
 */
function scanWhitespace(char: string, iter: TextStream): Token | void {
    var next: string;
    while (!nullish(next = iter.next) && isWhitespace(next)) iter.advance();
    // return { [IsTokenSymbol]: true, type: Tokens.Whitespace, body: ' ' };
}
/**
 * @param {import("./utils/stream").TextStream} iter
 * @param {string} firstChar
 */
function scanComment(iter: TextStream): Token | void {
    var next: string;
    while (!nullish(next = iter.move()) && next !== '\n');
    // return { [IsTokenSymbol]: true, type: Tokens.Comment, body: result + "\n" };
}
/**
 * @param {import("./utils/stream").TextStream} iter
 * @param {string} firstChar
 */
function scanMultiineComment(iter: TextStream, firstChar: string): Token | void {
    var result = firstChar;
    while (result + iter.next !== '*/') {
        result = iter.move();
    }
    iter.advance();
    // return { [IsTokenSymbol]: true, type: Tokens.MultilineComment, body: result.slice(0, -1) };
}

class Lexer implements TokenStream {
    private readonly numberChars = /[0-9\.\-\+]/;
    private readonly numberRegex = /^(?:[\-\+]?[0-9][_0-9]*)?(?:\.(\.[\-\+]?)?[0-9_]+)?$/m;
    private readonly operatorCharsRegex = /[<>\/*+\-?|&\^!%\.@:=\[\](){};,~#]/y;
    private readonly stringStartRegex = /^['"]/y;
    private readonly whitespaceRegex = /\s+/y;
    private readonly symbolicCharsRegex = /^[^\s<>\/*+\-?|&\^!%\.@:=\[\]~(){};,"'#]$/y;
    public readonly next: Token = undefined!;
    private _triaged?: Token;
    private _triageLength: number = 0;
    private _inited: boolean = false;
    constructor(public readonly text_stream: TextStream) { }
    public advance() {
        this._inited = true;
        if (this._triaged) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot advance token stream when a token is triaged!";
        return (this as { next: unknown; }).next = this._lex(this.text_stream.move());
    }
    public move() {
        this._inited = true;
        if (this._triaged) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot move token stream when a token is triaged!";
        const __next = this.next;
        (this as { next: unknown; }).next = this._lex(this.text_stream.move());
        return __next;
    }
    public try<P extends string>(end: string, prefix?: Prefix<P>): Token {
        this._inited = true;
        if (this._triaged) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot try a token 2 times!";
        const initialIndex = this.text_stream.index;
        const result = advance_next(this, end, prefix);
        this._triageLength = this.text_stream.index - initialIndex;
        return this._triaged = result;
    }
    public confirm_try() {
        this._triaged = undefined!;
        this._triageLength = 0;
    }
    public cancel_try() {
        this.text_stream.down(this._triageLength);
        this._triaged = undefined!;
        this._triageLength = 0;
    }
    public *[Symbol.iterator]() {
        this._inited || this.move();
        while (!nullish(this.next)) { yield this.move(); }
    }
    _lex(char: string): Token {
        if (nullish(char)) {
            return char;
        } else if (operatorCharsRegex.test(char)) {
            var _char = this.text_stream.move();
            var joined = char + _char;
            if (includes($2charoperators, joined)) {
                var __char = this.text_stream.move();
                var _joined = joined + __char;
                if (includes($3charoperators, _joined)) {
                    var ___char = this.text_stream.move();
                    var __joined = _joined + ___char;
                    if (">>>=" === __joined) {
                        return new Token(Tokens.Operator, __joined);
                    } else {
                        this.text_stream.down();
                        return new Token(Tokens.Operator, _joined);
                    }
                } else if (joined === "//") {
                    return scanComment(this.text_stream), this._lex(this.text_stream.move());
                } else if (joined === "/*") {
                    return scanMultiineComment(this.text_stream, __char), this._lex(this.text_stream.move());
                } else {
                    this.text_stream.down();
                    return new Token(Tokens.Operator, joined);
                }
            } else {
                this.text_stream.down();
                return new Token(Tokens.Operator, char);
            }
        } else if (isWhitespace(char)) {
            return scanWhitespace(char, this.text_stream), this._lex(this.text_stream.move());
        } else if (char === "'" || char === "\"") {
            return scanText(char, this.text_stream);
        } else if ('0' <= char && char <= '9') {
            return this.scanNumber(char);
        } else if (validChars.test(char)) {
            return scanSymbol(char, this.text_stream);
        } else {
            throw `Unrecognised character: "${ char }"!`;
        }
    }
    scanNumber(firstChar: string): Token {
        var result = firstChar, next: string;
        if (firstChar === "0") {
            const format = this.text_stream.move();
            if (format === "x") {
                result += format;
                while (
                    '0' <= (next = this.text_stream.move()) && next <= '9' ||
                    'a' <= next && next <= 'f' || 'A' <= next && next <= 'F'
                ) {
                    result += next;
                }
                if (validChars.test(next)) {
                    error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a hexadecimal digit.`);
                }
            } else if (format === "o") {
                result += format;
                while ('0' <= (next = this.text_stream.move()) && next <= '7') {
                    result += next;
                }
                if (next === "8" || next === "9") {
                    error_unexcepted_token(new Token(Tokens.Number, next), `; ${ next } is not an octal digit.`);
                }
                if (validChars.test(next)) {
                    error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not an octal digit.`);
                }
            } else if (format === ".") {
                const next = this.text_stream.move();
                if (next === ".") {
                    this.text_stream.down();
                } else {
                    result += format;
                    let next;
                    while ('0' <= (next = this.text_stream.move()) && next <= '9') {
                        result += next;
                    }
                    if (validChars.test(next)) {
                        error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
                    }
                }
            } else if (validChars.test(format)) {
                error_unexcepted_token(new Token(Tokens.Symbol, format), `; ${ format } is not a decimal digit.`);
            }
        } else {
            while ('0' <= (next = this.text_stream.move()) && next <= '9') {
                result += next;
            }
            if (next === ".") {
                result += next;
                while ('0' <= (next = this.text_stream.move()) && next <= '9') {
                    result += next;
                }
            }
            if (validChars.test(next)) {
                error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
            }
        }
            this.text_stream.down();
        return new Token(Tokens.Number, result);
    }
    scanSymbol(char: string, iter: TextStream): Token {
        var result = char, next: string;
        while (!nullish(next = iter.next) && symbolicCharsRegex.test(next)) {
            result += (iter.advance(), next);
        }
        return new Token(~keywords.indexOf(result) ? Tokens.Keyword : Tokens.Symbol, result);
    }
};

/**
 * @param {string} text 
 */
export function lex(text: string): TokenStream {
    return new Lexer(new Stream(text));
}