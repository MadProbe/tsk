import { Stream, type TextStream, Token, type TokenStream } from "./utils/stream.js";
import { error_unexcepted_token, nullish, undefined } from "./utils/util.js";
import { DiagnosticSeverity, Tokens } from "./enums";
import { keywords, $2charoperators, $3charoperators } from "./utils/constants.js";
import { advance_next, type Prefix } from "./utils/advancers.js";
import { MultiValueComparer, ValidCharsComparer } from "./utils/comparer.js";
import { Diagnostic } from "./parser.js";


const whitespaceCharsComparer = new MultiValueComparer("\t\f\v\r\n ");
const operatorCharsComparer = new MultiValueComparer("<>/*+-?|&^!%.@:=[](){};,~#`");
const $2charOperatorComparer = new MultiValueComparer($2charoperators);
const $3charOperatorComparer = new MultiValueComparer($3charoperators);
const keywordComparer = new MultiValueComparer(keywords);
const validAfterNumberChars = new MultiValueComparer([...whitespaceCharsComparer, ...operatorCharsComparer, "'" as const, '"' as const]);
const validIDComparer = new ValidCharsComparer();




class Lexer implements TokenStream {
    public readonly next!: Token;
    _triaged?: Token;
    _triageLength = 0;
    constructor(public readonly text_stream: TextStream) { }
    public advance() {
        if (this._triaged !== undefined) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot advance token stream when a token is triaged!";
        return (this as { next: Token; }).next = this._lex(this.text_stream.move());
    }
    public move() {
        if (this._triaged !== undefined) throw "FATAL_ERROR_FIX_ME_ASAP: Cannot move token stream when a token is triaged!";
        const __next = this.next;
        (this as { next: Token; }).next = this._lex(this.text_stream.move());
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
        var next: Token;
        while (!nullish(next = this.advance())) { yield next; }
    }
    private _lex(char: string): Token {
        if (nullish(char)) {
            return char;
        } else if (operatorCharsComparer.includes(char)) {
            var _char = this.text_stream.move();
            var joined = char + _char;
            if ($2charOperatorComparer.includes(joined)) {
                var __char = this.text_stream.move();
                var _joined = joined + __char;
                if ($3charOperatorComparer.includes(_joined)) {
                    var ___char = this.text_stream.move();
                    var __joined = _joined + ___char;
                    if (">>>=" === __joined) {
                        return new Token(Tokens.Operator, __joined);
                    } else {
                        this.text_stream.down(1);
                        return new Token(Tokens.Operator, _joined);
                    }
                } else if (joined === "//") {
                    return this._scanComment(), this._lex(this.text_stream.move());
                } else if (joined === "/*") {
                    return this._scanMultiineComment(__char), this._lex(this.text_stream.move());
                } else {
                    this.text_stream.down(1);
                    return new Token(Tokens.Operator, joined);
                }
            } else {
                this.text_stream.down(1);
                return new Token(Tokens.Operator, char);
            }
        } else if (whitespaceCharsComparer.includes(char)) {
            return this._scanWhitespace(), this._lex(this.text_stream.move());
        } else if (char === "'") {
            return this._scanSingleQuoteText();
        } else if (char === "\"") {
            return this._scanDoubleQuoteText();
        } else if ('0' <= char && char <= '9') {
            return this._scanNumber(char);
        } else if (validIDComparer.includes(char)) {
            return this._scanChars(char);
        } else {
            validIDComparer.init(char);
            if (validIDComparer.includes(char)) {
                return this._scanChars(char);
            }
            throw new Diagnostic(DiagnosticSeverity.FatalError, `Unregonized character ${ char }`, this).log()! ?? "";
        }
    }
    private _scanChars(result: string) {
        var next: string;
        while (!nullish(next = this.text_stream.next) && validIDComparer.includes(next)) {
            this.text_stream.advance();
            result += next;
        }
        return new Token(keywordComparer.includes(result) ? Tokens.Keyword : Tokens.Symbol, result);
    }
    private _scanSingleQuoteText(): Token {
        var result = "", last = "", next: string;
        while ((next = this.text_stream.move()) !== "'" || last + next === "\\'") {
            if (nullish(next)) {
                throw "Unexcepted EOF";
            }
            result += last = next;
        }
        return new Token(Tokens.String, result);
    }
    private _scanDoubleQuoteText(): Token {
        var result = "", last = "", next: string;
        while ((next = this.text_stream.move()) !== '"' || last + next === '\\"') {
            if (nullish(next)) {
                throw "Unexcepted EOF";
            }
            result += last = next;
        }
        return new Token(Tokens.String, result);
    }
    private _scanWhitespace(): void {
        var next: string;
        while (!nullish(next = this.text_stream.next) && whitespaceCharsComparer.includes(next)) this.text_stream.advance();
    }
    private _scanComment(): void {
        var next: string;
        while (!nullish(next = this.text_stream.move()) && next !== '\n');
    }
    private _scanMultiineComment(char: string): void {
        while (char + this.text_stream.next !== '*/') {
            char = this.text_stream.move();
        }
        this.text_stream.advance();
    }
    private _scanNumber(firstChar: string): Token {
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
                if (!validAfterNumberChars.includes(next)) {
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
                if (!validAfterNumberChars.includes(next)) {
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
                    if (!validAfterNumberChars.includes(next)) {
                        error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
                    }
                }
            } else if (!validAfterNumberChars.includes(format)) {
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
            if (!validAfterNumberChars.includes(next)) {
                error_unexcepted_token(new Token(Tokens.Symbol, next), `; ${ next } is not a decimal digit.`);
            }
        }
        this.text_stream.down(1);
        return new Token(Tokens.Number, result);
    }
};

/**
 * @param {string} text 
 */
export function lex(text: string): TokenStream {
    return new Lexer(new Stream(text));
}