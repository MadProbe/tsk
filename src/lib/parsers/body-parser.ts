import { Tokens, DiagnosticSeverity } from "../enums";
import { advance_next, assert_next_token, type Prefix } from "../utils/advancers.js";
import { _parse, pushDiagnostic } from "../parser.js";
import type { IParseMeta, INode } from "../nodes";
import type { Token, TokenStream } from "../utils/stream.js";


export function parse_body<P extends string>(stream: TokenStream, meta: IParseMeta, prefix?: Prefix<P>): INode[] {
    // var next: Token = advance_next(stream, "}", prefix);
    const nodes: INode[] = [];
    var next: Token
    //console.log(1123124);
    while ((next = advance_next(stream, "}", prefix)/*, console.log("next:", next), next*/).type !== Tokens.Operator || next.body !== "}") {
        // console.log(next);
        try {
            var _parsed = _parse(next, stream, meta);
            _parsed && nodes.push(_parsed);
            // next = advance_next(stream, "}", prefix);
        } catch (_e) {
            pushDiagnostic(DiagnosticSeverity.Error, _e as never, stream);
            // next = advance_next(stream, "}", prefix);
        }
    }
    return nodes;
}

export function parse_next_body<P extends string>(stream: TokenStream, meta: IParseMeta, prefix?: Prefix<P>): INode[] {
    assert_next_token(stream, Tokens.Operator, "{", prefix);
    return parse_body(stream, meta, prefix);
}
