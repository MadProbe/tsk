import { isArray } from "../utils/util.js";
import { Tokens, DiagnosticSeverity } from "../enums";
import { Diagnostic } from "../utils/diagnostics.js";
import { advance_next } from "../utils/advancers.js";
import { _parse, diagnostics } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { ParseMeta, Node } from "../nodes";

/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
export function parse_body(stream: TokenStream, meta: ParseMeta): Node[] {
    var next: Token = advance_next(stream, "}"), tokens = [] as Node[];
    //console.log(1123124);
    while ((next /*, console.log("next:", next), next*/)[0] !== Tokens.Special || next[1] !== "}") {
        // console.log(next);
        try {
            var _parsed = _parse(next, stream, meta);
            if (isArray(_parsed)) {
                _parsed[0] && tokens.push(_parsed[0]);
                next = stream.next;
                if (next[0] === Tokens.Special && next[1] === "}") {
                    break;
                }
            } else {
                _parsed && tokens.push(_parsed);
                next = advance_next(stream, "}");
            }
        } catch (_e) {
            if (_e === 1) {
                break;
            } else if (_e === 0) {
                break;
            } else {
                diagnostics.push(Diagnostic(DiagnosticSeverity.Error, String(_e)));
                next = advance_next(stream, "}");
            }
        }
    }
    return tokens;
}
