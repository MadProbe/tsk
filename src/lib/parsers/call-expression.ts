import { error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, Tokens } from "../enums";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { __parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { IParseMeta, INode } from "../nodes";

export function parse_call_expression(next: Token, stream: TokenStream, meta: IParseMeta): INode[] {
    const args: INode[] = [];
    if (next.type !== Tokens.Operator || next.body !== ")") {
        while (1) {
            if (next.type === Tokens.Operator && next.body === ")") {
                break;
            }
            if (next.type === Tokens.Operator && next.body === ",") {
                args.push({
                    name: Nodes.UndefinedValue,
                    type: NodeType.Expression
                });
                next = advance_next(stream, end_expression);
                continue;
            }
            args.push(__parse(next, stream, meta));
            next = advance_next(stream, ")");
            if (next.type === Tokens.Operator) {
                if (next.body === ")") {
                    break;
                } else if (next.body !== ",") {
                    error_unexcepted_token(next);
                }
            } else
                error_unexcepted_token(next);
            next = advance_next(stream, end_expression);
        }
    }
    return args;
}
