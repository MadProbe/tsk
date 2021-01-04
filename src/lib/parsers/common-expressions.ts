import { Token, TokenStream } from "../utils/stream.js";
import { isArray } from "../utils/util.js";
import { Nodes, NodeType } from "../enums";
import { CommonOperatorTable, CommonOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { next_and_skip_shit_or_fail } from "../utils/advancers";
import { Node, ParseMeta, _parse } from "../parser";

export function parse_common_expressions(_sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var parsed: Node, node: Node, name = CommonOperatorTable[next[1] as CommonOperatorTableKeys] as Nodes | undefined;
    if (name) {
        parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta) as Node;
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
