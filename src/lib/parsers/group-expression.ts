import { Nodes, NodeType, Tokens } from "../enums.js";
import { advance_next } from "../utils/advancers.js";
import { end_expression } from "../utils/constants.js";
import { error_unexcepted_token, includes, isArray } from "../utils/util.js";
import { __parse } from "../parser.js";
import { Token, TokenStream } from "../utils/stream.js";
import type { Node, ParseMeta } from "../nodes.js";

export function parse_group_expression(stream: TokenStream, meta: ParseMeta) {
    var prefix = "Group expression:" as const, 
        next: Token,
        body: Node[] = [],
        node = { name: Nodes.GroupExpression, type: NodeType.Expression, body } as Node,
        parsed: Node | [Node];
    while (next = advance_next(stream, end_expression, prefix), next[0] !== Tokens.Special || next[1] !== ")") {
        parsed = __parse(next, stream, meta);
        if (isArray(parsed)) {
            parsed = parsed[0];
            next = stream.next;
        } else next = advance_next(stream, end_expression, prefix);
        body.push(parsed);
        if (next[0] !== Tokens.Special && !includes(",)", next[1])) {
            error_unexcepted_token(next);
        } else if (next[1] === ")") {
            break;
        }
    }
    return __parse(node, stream, meta);
}