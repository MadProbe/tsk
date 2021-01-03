import { Stream, TextStream, Token, TokenList } from "./utils/stream.js";
import { nullish } from "./utils/util.js";
import { Tokens } from "./enums";
import { keywords, validChars } from "./utils/indentifier-stuff.js";

var numberChar = /[0-9.\-\+]/;
var numberTest = /^(?:[\-\+]?[0-9][_0-9]*)?(?:\.(\.[\-\+]?)?[0-9_]+)?$/m;
var specialCharsTest = /[(){};,]/m;
var operatorCharsTest = /^[<>\/*+\-?|&\^!%\.@:=\[\]~#]$/m;
var regexTest = /^`$/m;
var stringTest = /^'|"$/m;
var regexModTest = /^[gmiyus]$/m;
var whitespaceTest = /\s/;
var $2charoperators = ["&&", "**", "||", "??", "==", "!=", "=>", "<=", ">=", "..", "+=", "/=", "&=", "-=", "++", "--", "*=", "|=", "//", ">>", "<<", "?.", "%=", "^=", "|>", "@@", "/*", "::", "!.", "!["];
var $3charoperators = ["?.[", "?.(", "??=", "||=", "&&=", "**=", ">>>", "...", ">>=", "<<=", "===", "!=="];
var symbolic = /^[^\s<>\/*+\-?|&\^!%\.@:=\[\]~(){};,"'#]$/m;

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
 * @param {string} firstChar
 * @param {import("./utils/stream").TextStream} iter
 * @returns {import("./utils/stream").Token}
 */
function scanNumber(firstChar: string, iter: TextStream): Token {
    var result = firstChar, c: string;
    while (!nullish(c = iter.next) && numberChar.test(c)) {
        result += iter.move();
    }
    if (!numberTest.test(result) || !result) {
        throw `${ result } is not a valid number!`;
    }
    return [/[\-\+]?\d+\.\.[\-\+]?\d+/.test(result) ? Tokens.Range : Tokens.Number, result];
}
/**
 * @param {string} quot
 * @param {import("./utils/stream").TextStream} iter
 */
function scanText(quot: string, iter: TextStream) {
    arguments
    var result = "", last = "", compound = '\\' + quot;
    while (iter.next !== quot || last + iter.next === compound) {
        last = iter.move();
        if (nullish(last)) {
            throw "Unexcepted EOF";
        }
        result += last;
    }
    iter.move();
    return result;
}
/**
 * @param {string} char
 * @param {import("./utils/stream").TextStream} iter
 * @returns {import("./utils/stream").Token}
 */
function scanSymbol(char: string, iter: TextStream): Token {
    var result = char, next: string;
    while (!nullish(next = iter.next) && symbolic.test(next)) {
        result += iter.move();
    }
    if (!validChars.test(result)) {
        throw `${ result } is not a valid symbol!`;
    }
    return [~keywords.indexOf(result) ? Tokens.Keyword : Tokens.Symbol, result];
}
/**
 * @param {string} char
 * @param {import("./utils/stream").TextStream} iter
 */
function scanWhitespace(char: string, iter: TextStream) {
    var result = char, next: string;
    while (!nullish(next = iter.next) && whitespaceTest.test(next)) {
        result += iter.move();
    }
    return result;
}
/**
 * @param {import("./utils/stream").TextStream} iter
 * @returns {import("./utils/stream").Token}
 */
function scanRegex(iter: TextStream): Token {
    var result = "", regexMods = "", next: string;
    while ((next = iter.next) !== '`') {
        if (nullish(next)) {
            throw "Invalid regular expression: missing `";
        }
        result += iter.move();
    }
    iter.move();
    // TS thinks that stream's next property doesn't change
    // @ts-ignore
    while (!~regexMods.indexOf(next = iter.next) && next.trim() && next !== ";" && !whitespaceTest.test(next)) {
        if (!regexModTest.test(next)) throw `Invalid regular expression flag: '${ next }'`;
        if (~regexMods.indexOf(next)) throw `Duplicated regular expression flag: '${ next }'`;
        regexMods += iter.move();
    }
    return [Tokens.Regex, result, regexMods];
}
/**
 * @param {import("./utils/stream").TextStream} iter
 * @param {string} firstChar
 */
function scanComment(iter: TextStream, firstChar: string) {
    var result = firstChar || "";
    while (iter.next && iter.next !== '\n') {
        result += iter.move();
    }
    iter.move();
    return result + "\n";
}
/**
 * @param {import("./utils/stream").TextStream} iter
 * @param {string} firstChar
 */
function scanMultiineComment(iter: TextStream, firstChar: string) {
    var result = firstChar, length = 0;
    while (result[length] + iter.next !== '*/') {
        result += iter.move();
        length++;
    }
    iter.move();
    return result.slice(0, -1);
}
/**
 * @param {import("./utils/stream").TokenList} tokens
 * @param {string} char
 * @param {import("./utils/stream").TextStream} iter
 */
function _lex(tokens: TokenList, char: string, iter: TextStream) {
    if (whitespaceTest.test(char)) {
        tokens.push([Tokens.Whitespace, scanWhitespace(char, iter)]);
    } else if (specialCharsTest.test(char)) {
        tokens.push([Tokens.Special, char]);
    } else if (operatorCharsTest.test(char) || char === ".") {
        _char = iter.move();
        joined = char + _char;
        if ((char === "-" || char === "+") && /^[\d\.]$/m.test(_char)) {
            _lex(tokens, joined, iter);
        } else if (~$2charoperators.indexOf(joined)) {
            __char = iter.move();
            _joined = joined + __char;
            if (~$3charoperators.indexOf(_joined)) {
                ___char = iter.move();
                __joined = _joined + ___char;
                if (">>>=" === __joined) {
                    tokens.push([Tokens.Operator, __joined]);
                    _lex(tokens, iter.move(), iter);
                } else {
                    tokens.push([Tokens.Operator, _joined]);
                    _lex(tokens, ___char, iter);
                }
            } else if (joined === "//") {
                tokens.push([Tokens.Comment, scanComment(iter, __char)]);
            } else if (joined === "/*") {
                tokens.push([Tokens.MultilineComment, scanMultiineComment(iter, __char)]);
            } else {
                tokens.push([Tokens.Operator, joined]);
                _lex(tokens, __char, iter);
            }
        } else {
            // console.log(`Char: '${char}', NextChar: '${_char}'`);
            tokens.push([Tokens.Operator, char]);
            _lex(tokens, _char, iter);
        }
    } else if (whitespaceTest.test(char)) {
        tokens.push([Tokens.Whitespace, scanWhitespace(char, iter)]);
    } else if (specialCharsTest.test(char)) {
        tokens.push([Tokens.Special, char]);
    } else if (regexTest.test(char)) {
        tokens.push(scanRegex(iter));
    } else if (stringTest.test(char)) {
        tokens.push([Tokens.String, scanText(char, iter)]);
    } else if (/[0-9\-\+]/.test(char)) {
        tokens.push(scanNumber(char, iter));
    } else if (validChars.test(char)) {
        tokens.push(scanSymbol(char, iter));
    } else {
        throw `Unrecognised character: "${ char }"!`;
    }
}
var _char: string,
    __char: string,
    ___char: string,
    joined: string,
    _joined: string,
    __joined: string;
/**
 * @param {string} text 
 */
export function lex(text: string) {
    /**@type {import("./utils/stream").TokenList} */
    var tokens: TokenList = [],
        iter = Stream(text);
    while (!nullish(iter.next)) {
        _lex(tokens, iter.move(), iter);
    }
    return tokens;
}