import { error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, ParseNodeKind, Tokens } from "../enums";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { parse_operators, _parse, __parse } from "../parser.js";
import type { INode, IParseMeta } from "../nodes";
import type { Token, TokenStream } from "../utils/stream.js";


export function parse_array_expression(stream: TokenStream, meta: IParseMeta) {
    const body: INode[] = [];
    /**@type {import("./parser").Node}*/
    const node: INode = {
        name: Nodes.Array,
        type: NodeType.Expression,
        body
    };
    var parsed: INode;
    var next: Token;
    while (next = advance_next(stream, end_expression)) {
        if (next.type === Tokens.Operator && next.body === ",") {
            body.push({
                name: Nodes.UndefinedValue,
                type: NodeType.Expression
            });
            continue;
        } else if (next.type === Tokens.Operator && next.body === "]") {
            break;
        }
        parsed = __parse(next, stream, meta);
        next = advance_next(stream, ']" or ",');
        if (next.type !== Tokens.Operator || next.body !== "," && next.body !== ']') {
            error_unexcepted_token(next);
        }
        body.push(parsed);
        if (next.body === "]") {
            break;
        }
    }
    // trailing undefineds are needed here
    // remove_trailing_undefined(body);
    parsed = parse_operators(node, stream, meta, ParseNodeKind.Expression);
    return parsed;
}
