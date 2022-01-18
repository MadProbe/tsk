import { Nodes, NodeType, ParseNodeKind, Tokens } from "../enums.js";
import { advance_next } from "../utils/advancers.js";
import { end_expression } from "../utils/constants.js";
import { error_unexcepted_token, includes } from "../utils/util.js";
import { parse_operators, __parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import { ExpressionWithBodyNode, INode, IParseMeta } from "../nodes.js";
import { MultiValueComparer } from "../utils/comparer.js";


const group_end_comparer = new MultiValueComparer(",)");
export function parse_group_expression(stream: TokenStream, meta: IParseMeta) {
    const prefix = "Group expression:", body: INode[] = [],
        node: INode = ExpressionWithBodyNode(Nodes.GroupExpression, body);
    var next: Token, parsed: INode;
    while (next = advance_next(stream, end_expression, prefix), next.type !== Tokens.Operator || next.body !== ")") {
        parsed = __parse(next, stream, meta);
        next = advance_next(stream, end_expression, prefix);
        body.push(parsed);
        if (next.type !== Tokens.Operator || !group_end_comparer.includes(next.body)) {
            error_unexcepted_token(next);
        } else if (next.body === ")") {
            break;
        }
    }
    return parse_operators(node, stream, meta, ParseNodeKind.Expression);
}