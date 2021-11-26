import { isArray } from "../utils/util.js";
import { Nodes, NodeType } from "../enums";
import { CommonOperatorTable, type CommonOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { __parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { INode, IParseMeta } from "../nodes";

export function parse_common_expressions(_sym: INode, next: Token, stream: TokenStream, meta: IParseMeta) {
    var parsed: INode, node: INode, name: Nodes | undefined = CommonOperatorTable[next.body as CommonOperatorTableKeys];
    if (name) {
        parsed = __parse(advance_next(stream, end_expression), stream, meta) as INode;
        node = {
            name,
            type: NodeType.Expression,
            body: [_sym, parsed],
            symbol: { and: "&&", or: "||" }[next.body] || next.body
        };
        if (name === Nodes.ExponentiationExpression) {
            // Here is the logic:
            // If parsed is a common | assignment expression
            // Succumb it onto this ** expression
            // @ts-ignore
            if (typeof parsed.symbol === "string" && isArray(parsed.body)) {
                // 
                // @ts-ignore
                node.body[1] = parsed.body[0];
                // @ts-ignore
                parsed.body[0] = node;
            }
            return parsed;
        }
        return node;
    }
}
