import { TokenStream } from "../utils/stream.js";
import { fatal, nullish, undefined } from "../utils/util.js";
import { RegularExpressionNode } from "../nodes.js";
import { MultiValueComparer } from "../utils/comparer.js";
import { validAfterNumberChars } from "../lexer.js";
import { pushDiagnostic } from "../parser.js";
import { DiagnosticSeverity } from "../enums.js";


const validChars = new MultiValueComparer([...validAfterNumberChars, "\\" as const]);
const validFlags = new MultiValueComparer("dgmuiys");
export function parse_regexp({ text_stream }: TokenStream) {
    function parse_list() {
        while (next !== "]") {
            if (nullish(next)) {
                fatal("Unterminated regular expression character list");
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
            if (nullish(next)) {
                fatal("Unterminated regular expression group");
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
    var next: string, body = "/";
    while ((next = text_stream.next) !== "/") {
        if (nullish(next)) {
            fatal("Unterminated regular expression");
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
    while (validChars.includes(text_stream.next)) {
        if (!validFlags.includes(text_stream.next)) {
            pushDiagnostic(DiagnosticSeverity.Error, `Invalid regular expression flag ${ text_stream.move() }`);
            break;
        }
        body += text_stream.move();
    }
    return RegularExpressionNode(body);
}