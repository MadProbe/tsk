import { Token, TokenStream } from "../utils/stream.js";
import { isArray, includes, error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, AccessChainItemKind, Tokens } from "../enums";
import { meberAccessOperators, end_expression } from "../utils/constants.js";
import { Node, ParseMeta, AccessChainItem, __parse, __used, _parse } from "../parser.js";
import { next_and_skip_shit_or_fail, downgrade_next } from "../utils/advancers.js";

export function _parseMemberAccess(sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var chain = [{
        kind: AccessChainItemKind.Head,
        body: sym
    }] as AccessChainItem[];
    while (next[0] === Tokens.Operator && includes(meberAccessOperators, next[1])) {
        if (next[1] === ".") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Normal,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Computed,
                body: parsed
            });
        } else if (next[1] === "?.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Optional,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "?.[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.OptionalComputed,
                body: parsed
            });
        } else if (next[1] === "!.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: AccessChainItemKind.NormalNullAsserted,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "![") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: AccessChainItemKind.ComputedNullAsserted,
                body: parsed
            });
        } else {
            break;
        }
        next = next_and_skip_shit_or_fail(stream, "any");
    }
    downgrade_next(stream);
    return chain;
}
export function parseMemberAccess(sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    return _parse({
        name: Nodes.MemberAccessExpression,
        type: NodeType.Expression,
        body: _parseMemberAccess(sym, next, stream, meta),
    }, stream, meta);
}
