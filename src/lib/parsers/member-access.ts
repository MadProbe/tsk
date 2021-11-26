import { includes } from "../utils/util.js";
import { Nodes, NodeType, AccessChainItemKind, Tokens, ParseNodeKind } from "../enums";
import { meberAccessOperators, end_expression } from "../utils/constants.js";
import { __parse, __used, _parse, parse_operators } from "../parser.js";
import { advance_next, except_next_token } from "../utils/advancers.js";
import type { Token, TokenStream } from "../utils/stream.js";
import { INode, IParseMeta, AccessChainItem } from "../nodes";

export function _parseMemberAccess(sym: INode, next: Token, stream: TokenStream, meta: IParseMeta) {
    var chain: AccessChainItem[] = [new AccessChainItem(AccessChainItemKind.Head, sym)];
    while (next.type === Tokens.Operator && includes(meberAccessOperators, next.body)) {
        stream.confirm_try();
        if (next.body === ".") {
            chain.push(new AccessChainItem(AccessChainItemKind.Normal, {
                name: Nodes.SymbolNoPrefix,
                type: NodeType.Expression,
                symbol: except_next_token(stream, Tokens.Symbol | Tokens.Keyword).body
            }));
        } else if (next.body === "[") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            except_next_token(stream, Tokens.Operator, "]");
            chain.push(new AccessChainItem(AccessChainItemKind.Computed, parsed));
        } else if (next.body === "?.") {
            chain.push(new AccessChainItem(AccessChainItemKind.Optional, {
                name: Nodes.SymbolNoPrefix,
                type: NodeType.Expression,
                symbol: except_next_token(stream, Tokens.Symbol | Tokens.Keyword).body
            }));
        } else if (next.body === "?.[") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            except_next_token(stream, Tokens.Operator, "]");
            chain.push(new AccessChainItem(AccessChainItemKind.OptionalComputed, parsed));
        } else if (next.body === "!.") {
            __used.na = true;
            chain.push(new AccessChainItem(AccessChainItemKind.NormalNullAsserted, {
                name: Nodes.SymbolNoPrefix,
                type: NodeType.Expression,
                symbol: except_next_token(stream, Tokens.Symbol | Tokens.Keyword).body
            }));
        } else if (next.body === "!.[") {
            var parsed = __parse(advance_next(stream, end_expression), stream, meta);
            except_next_token(stream, Tokens.Operator, "]");
            __used.na = true;
            chain.push(new AccessChainItem(AccessChainItemKind.ComputedNullAsserted, parsed));
        } else {
            break;
        }
        try {
            next = stream.try("operator");
        } catch {
            break;
        }
    }
    stream.cancel_try();
    return chain;
}
export function parseMemberAccess(sym: INode, next: Token, stream: TokenStream, meta: IParseMeta) {
    return parse_operators({
        name: Nodes.MemberAccessExpression,
        type: NodeType.Expression,
        body: _parseMemberAccess(sym, next, stream, meta),
    }, stream, meta, ParseNodeKind.Expression);
}
