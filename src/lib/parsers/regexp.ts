import { Nodes, NodeType } from "../enums";
import { TokenStream } from "../utils/stream.js";
import { undefined } from "../utils/util.js";
import type { INode } from "../nodes.js";


const symbolicCharsRegex = /^[^\s<>\/*+\-?|&\^!%\.@:=\[\]~(){};,"'#]$/m;
export function parse_regexp({ text_stream }: TokenStream) {
    function parse_list() {
        while (next !== "]") {
            if (next == undefined) {
                throw "Unterminated regular expression character list.";
            }
            if (next === "\\") {
                body += next + text_stream.move();
                next = text_stream.move();
                continue;
            }
            if (next === "(") {
                parse_group();
            }
            body += next;
            next = text_stream.move();
        }
    }
    function parse_group() {
        while (next !== ")") {
            if (next == undefined) {
                throw "Unterminated regular expression character list.";
            }
            if (next === "\\") {
                body += next + text_stream.move();
                next = text_stream.move();
                continue;
            }
            if (next === "[") {
                parse_list();
            }
            body += next;
            next = text_stream.move();
        }
    }
    var node: INode = {
        name: Nodes.RegularExpression,
        type: NodeType.Expression,
        symbol: ""
    }, next: string, body = "/";
    while ((next = text_stream.next) !== "/") {
        if (next == undefined) {
            throw "Unterminated regular expression";
        }
        if (next === "\\") {
            body += text_stream.move() + text_stream.move();
            continue;
        }
        if (next === "[") {
            parse_list();
        }
        if (next === "(") {
            parse_group();
        }
        body += next;
        next = text_stream.move();
    }
    body += text_stream.move();
    while (text_stream.next != undefined && symbolicCharsRegex.test(text_stream.next)) {
        if (!/[dgmuiys]/.test(text_stream.next)) throw `Invalid regular expression flag ${ text_stream.next }`;
        body += text_stream.next;
        text_stream.move();
    }
    node.symbol = body;
    return node;
}