import { isArray } from "../utils/util.js";
import { Nodes, NodeType } from "../enums";
import { CommonOperatorTable, CommonOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { __parse } from "../parser.js";
import { Token, TokenStream } from "../utils/stream.js";
import type { Node, ParseMeta } from "../nodes";

export function parse_common_expressions(_sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var parsed: Node, node: Node, name = CommonOperatorTable[next[1] as CommonOperatorTableKeys] as Nodes | undefined;
    if (name) {
        parsed = __parse(advance_next(stream, end_expression), stream, meta) as Node;
        node = {
            name,
            type: NodeType.Expression,
            body: [_sym, parsed],
            symbolName: next[1]
        };
        if (name === Nodes.ExponentiationExpression) {
            // Here is the logic:
            // If parsed is a common | assignment expression
            // @ts-ignore
            if (typeof parsed.symbolName === "string" && isArray(parsed.body)) {
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
