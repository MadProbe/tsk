import { Tokens, DiagnosticSeverity } from "../enums";
import { advance_next, assert_next_token, type Prefix } from "../utils/advancers.js";
import { _parse, pushDiagnostic } from "../parser.js";
import type { IParseMeta, INode } from "../nodes";
import type { Token, TokenStream } from "../utils/stream.js";


export function parse_body<P extends string>(stream: TokenStream, meta: IParseMeta, prefix?: Prefix<P>): INode[] {
    const nodes: INode[] = [];
    var next: Token;
    while ((next = advance_next(stream, "}", prefix)).type !== Tokens.Operator || next.body !== "}") {
        try {
            const _parsed = _parse(next, stream, meta);
            _parsed && nodes.push(_parsed);
        } catch (_e) {
            pushDiagnostic(DiagnosticSeverity.Error, _e, stream);
        }
    }
    return nodes;
}

export function parse_next_body<P extends string>(stream: TokenStream, meta: IParseMeta, prefix?: Prefix<P>): INode[] {
    assert_next_token(stream, Tokens.Operator, "{", prefix);
    return parse_body(stream, meta, prefix);
}
