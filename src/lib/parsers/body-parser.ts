import { Token, TokenStream } from "../utils/stream.js";
import { isArray } from "../utils/util.js";
import { Tokens, DiagnosticSeverity } from "../enums";
import { Diagnostic } from "../utils/diagnostics.js";
import { next_and_skip_shit_or_fail } from "../utils/advancers.js";
import { _parse, diagnostics } from "../parser.js";
import type { ParseMeta, Node } from "../nodes";

/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
export function parse_body(stream: TokenStream, meta: ParseMeta): Node[] {
    var next: Token = next_and_skip_shit_or_fail(stream, "}"), tokens = [] as Node[];
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
                next = next_and_skip_shit_or_fail(stream, "}");
            }
        } catch (_e) {
            if (_e === 1) {
                break;
            } else if (_e === 0) {
                break;
            } else {
                diagnostics.push(Diagnostic(DiagnosticSeverity.Error, String(_e)));
                next = next_and_skip_shit_or_fail(stream, "}");
            }
        }
    }
    return tokens;
}
