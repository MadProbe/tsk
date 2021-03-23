import { isArray, error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, Tokens } from "../enums";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { __parse } from "../parse-dummies.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { ParseMeta, Node } from "../nodes";

export function parse_call_expression(next: Token, stream: TokenStream, meta: ParseMeta) {
    var arg: Node | [Node], args = [] as Node[];
    if (next[0] !== Tokens.Special || next[1] !== ")") {
        while (1) {
            if (next[0] === Tokens.Special && next[1] === ")") {
                break;
            }
            if (next[0] === Tokens.Special && next[1] === ",") {
                args.push({
                    name: Nodes.UndefinedValue,
                    type: NodeType.Expression
                });
                next = advance_next(stream, end_expression);
                continue;
            } else {
                arg = __parse(next, stream, meta) as Node | [Node];
            }
            if (isArray(arg)) {
                next = stream.next;
                arg = arg[0];
            } else
                next = advance_next(stream, ")");
            args.push(arg);
            if (next[0] === Tokens.Special) {
                if (next[1] === ")") {
                    break;
                } else if (next[1] !== ",") {
                    error_unexcepted_token(next);
                }
            } else
                error_unexcepted_token(next);
            next = advance_next(stream, end_expression);
        }
    }
    return args;
}
