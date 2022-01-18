import { Nodes, AccessChainItemKind, Tokens, ParseNodeKind } from "../enums";
import { __parse, __used, _parse, parse_operators } from "../parser.js";
import { MultiValueComparer } from "../utils/comparer.js";
import { advance_next, assert_next_token } from "../utils/advancers.js";
import { member_access_operators, end_expression } from "../utils/constants.js";
import { type INode, type ParseMeta, AccessChainItem, PrefixlessSymbolNode, ExpressionWithBodyNode } from "../nodes";
import type { Token, TokenStream } from "../utils/stream.js";
import { should_not_happen } from "../utils/util.js";


const memberAccessOperatorsComparer = new MultiValueComparer(member_access_operators);
export const optionalChainsSet = new WeakSet;
export function parse_member_access(sym: INode, next: Token, stream: TokenStream, meta: ParseMeta) {
    const chain = [new AccessChainItem(AccessChainItemKind.Head, sym)], node = ExpressionWithBodyNode(Nodes.MemberAccessExpression, chain);
    while (next.type === Tokens.Operator && memberAccessOperatorsComparer.includes(next.body)) {
        stream.confirm_try();
        switch (next.body) {
            case ".":
                chain.push(new AccessChainItem(AccessChainItemKind.Normal, PrefixlessSymbolNode(assert_next_token(stream, Tokens.Symbol | Tokens.Keyword).body)));
                break;

            case "[": {
                const parsed = __parse(advance_next(stream, end_expression), stream, meta);
                assert_next_token(stream, Tokens.Operator, "]");
                chain.push(new AccessChainItem(AccessChainItemKind.Computed, parsed));
                break;
            }

            case "?.":
                optionalChainsSet.add(node);
                chain.push(new AccessChainItem(AccessChainItemKind.Optional, PrefixlessSymbolNode(assert_next_token(stream, Tokens.Symbol | Tokens.Keyword).body)));
                break;

            case "?.[": {
                optionalChainsSet.add(node);
                const parsed = __parse(advance_next(stream, end_expression), stream, meta);
                assert_next_token(stream, Tokens.Operator, "]");
                chain.push(new AccessChainItem(AccessChainItemKind.OptionalComputed, parsed));
                break;
            }

            default:
                should_not_happen();
        }
        try {
            next = stream.try("operator");
        } catch {
            break;
        }
    }
    stream.cancel_try();
    return ExpressionWithBodyNode(Nodes.MemberAccessExpression, chain);
}
