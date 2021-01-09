import { isArray, includes, error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, AccessChainItemKind, Tokens } from "../enums";
import { meberAccessOperators, end_expression } from "../utils/constants.js";
import { __parse, __used, _parse } from "../parser.js";
import { advance_next, downgrade_next } from "../utils/advancers.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { Node, ParseMeta, AccessChainItem } from "../nodes";

export function _parseMemberAccess(sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var chain = [{
        kind: AccessChainItemKind.Head,
        body: sym
    }] as AccessChainItem[];
    while (next[0] === Tokens.Operator && includes(meberAccessOperators, next[1])) {
        if (next[1] === ".") {
            next = advance_next(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Normal,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "[") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = advance_next(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Computed,
                body: parsed
            });
        } else if (next[1] === "?.") {
            next = advance_next(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Optional,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "?.[") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = advance_next(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.OptionalComputed,
                body: parsed
            });
        } else if (next[1] === "!.") {
            next = advance_next(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: AccessChainItemKind.NormalNullAsserted,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "![") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = advance_next(stream, "]");
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
        next = advance_next(stream, "any");
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
