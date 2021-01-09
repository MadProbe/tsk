import { Token, TokenStream } from "../utils/stream.js";
import { isArray, error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, Tokens } from "../enums";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { Node, ParseMeta } from "../nodes";
import { _parse, __parse } from "../parser";

export function parse_array_expression(stream: TokenStream, meta: ParseMeta) {
    /**@type {import("./parser").Node}*/
    var node: Node = {
        name: Nodes.Array,
        type: NodeType.Expression,
        body: []
    };
    var body = node.body! as Node[];
    var parsed: Node | [Node];
    var next: Token;
    while (1) {
        next = advance_next(stream, end_expression);
        if (next[0] === Tokens.Special && next[1] === ",") {
            body.push({
                name: Nodes.UndefinedValue,
                type: NodeType.Expression
            });
            continue;
        } else if (next[0] === Tokens.Operator && next[1] === "]") {
            break;
        }
        parsed = _parse(next, stream, meta);
        if (isArray(parsed)) {
            next = stream.next;
            parsed = parsed[0];
        }
        else
            next = advance_next(stream, ']" or ",');
        if ((next[0] !== Tokens.Special || next[1] !== ",") &&
            (next[0] !== Tokens.Operator || next[1] !== ']')) {
            error_unexcepted_token(next);
        }
        body.push(parsed);
        if (next[1] === "]") {
            break;
        }
    }
    // trailing undefineds are needed here
    // remove_trailing_undefined(body);
    parsed = __parse(node, stream, meta);
    return parsed;
}
