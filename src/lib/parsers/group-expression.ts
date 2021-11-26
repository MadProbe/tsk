import { Nodes, NodeType, ParseNodeKind, Tokens } from "../enums.js";
import { advance_next } from "../utils/advancers.js";
import { end_expression } from "../utils/constants.js";
import { error_unexcepted_token, includes } from "../utils/util.js";
import { parse_operators, __parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { INode, IParseMeta } from "../nodes.js";

export function parse_group_expression(stream: TokenStream, meta: IParseMeta) {
    var prefix = "Group expression:" as const,
        next: Token,
        body: INode[] = [],
        node: INode = { name: Nodes.GroupExpression, type: NodeType.Expression, body },
        parsed: INode;
    while (next = advance_next(stream, end_expression, prefix), next.type !== Tokens.Operator || next.body !== ")") {
        parsed = __parse(next, stream, meta);
        next = advance_next(stream, end_expression, prefix);
        body.push(parsed);
        if (next.type !== Tokens.Operator && !includes(",)", next.body)) {
            error_unexcepted_token(next);
        } else if (next.body === ")") {
            break;
        }
    }
    return parse_operators(node, stream, meta, ParseNodeKind.Expression);
}