import { Stream, type TextStream, Token, type TokenStream } from "./utils/stream.js";
import { error_unexcepted_token, includes, nullish, undefined } from "./utils/util.js";
import { Tokens } from "./enums";
import { keywords, validChars, $2charoperators, $3charoperators } from "./utils/constants.js";
import { advance_next, type Prefix } from "./utils/advancers.js";


const operatorCharsRegex = /[<>\/*+\-?|&\^!%\.@:=\[\](){};,~#]/;


function isWhitespace(char: string) {
    return char === "\r" || char === "\n" || char === " " || char === "\t" || char === "\f" || char === "\v";
}


class Lexer implements TokenStream {
    public readonly next!: Token;
    _triaged?: Token;
    _triageLength = 0;
    constructor(public readonly text_stream: TextStream) { }
    public advance() {
        if (this._triaged !== undefined) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot advance token stream when a token is triaged!";
        return (this as { next: Token; }).next = this.#lex(this.text_stream.move());
    }
    public move() {
        if (this._triaged !== undefined) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot move token stream when a token is triaged!";
        const __next = this.next;
        (this as { next: Token; }).next = this.#lex(this.text_stream.move());
        return __next;
    }
    public try<P extends string>(end: string, prefix?: Prefix<P>): Token {
        if (this._triaged !== undefined) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot try a token 2 times!";
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
        this.next || this.advance();
        while (!nullish(this.next)) { yield this.move(); }
    }
    #lex(char: string): Token {
        var result: string | undefined;
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
                        this.text_stream.down(1);
                        return new Token(Tokens.Operator, _joined);
                    }
                } else if (joined === "//") {
                    return this.#scanComment(), this.#lex(this.text_stream.move());
                } else if (joined === "/*") {
                    return this.#scanMultiineComment(__char), this.#lex(this.text_stream.move());
                } else {
                    this.text_stream.down(1);
                    return new Token(Tokens.Operator, joined);
                }
            } else {
                this.text_stream.down(1);
                return new Token(Tokens.Operator, char);
            }
        } else if (isWhitespace(char)) {
            return this.#scanWhitespace(), this.#lex(this.text_stream.move());
        } else if (char === "'" || char === "\"") {
            return this.#scanText(char);
        } else if ('0' <= char && char <= '9') {
            return this.#scanNumber(char);
        } else if (result = this.#match(validChars)) {
            this.text_stream.index = validChars.lastIndex;
            return new Token(~keywords.indexOf(result) ? Tokens.Keyword : Tokens.Symbol, result);
        } else {
            throw `Unrecognised character: "${ char }"!`;
        }
    }
    #scanText(quot: string): Token {
        var result = "", last = "", compound = '\\' + quot, next: string;
        while (!nullish(next = this.text_stream.next) && (next !== quot || last + next === compound)) {
            last = (this.text_stream.advance(), next);
            if (nullish(last)) {
                throw "Unexcepted EOF";
            }
            result += last;
        }
        this.text_stream.advance();
        return new Token(Tokens.String, result);
    }
    #scanWhitespace(): void {
        var next: string;
        while (!nullish(next = this.text_stream.next) && isWhitespace(next)) this.text_stream.advance();
    }
    #scanComment(): void {
        var next: string;
        while (!nullish(next = this.text_stream.move()) && next !== '\n');
    }
    #scanMultiineComment(char: string): void {
        while (char + this.text_stream.next !== '*/') {
            char = this.text_stream.move();
        }
        this.text_stream.advance();
    }
    #scanNumber(firstChar: string): Token {
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
                if (this.#matchText(validChars, next)) {
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
                if (this.#matchText(validChars, next)) {
                    error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not an octal digit.`);
                }
            } else if (format === ".") {
                const next = this.text_stream.move();
                if (next === ".") {
                    this.text_stream.down(1);
                } else {
                    result += format;
                    let next;
                    while ('0' <= (next = this.text_stream.move()) && next <= '9') {
                        result += next;
                    }
                    if (this.#matchText(validChars, next)) {
                        error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
                    }
                }
            } else if (this.#matchText(validChars, format)) {
                throw "A number literal cannot start with zero";
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
            if (this.#matchText(validChars, next)) {
                error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
            }
        }
        this.text_stream.down(1);
        return new Token(Tokens.Number, result);
    }
    #match(regex: RegExp): string | undefined {
        regex.lastIndex = this.text_stream.index - 1;
        return regex.exec(this.text_stream.text)?.[0];
    }
    #matchText(regex: RegExp, text: string): string | undefined {
        regex.lastIndex = 0;
        return regex.exec(text)?.[0];
    }
};

/**
 * @param {string} text 
 */
export function lex(text: string): TokenStream {
    return new Lexer(new Stream(text));
}