import { Nodes } from "../enums";
import { CommonOperatorTable, type CommonOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { __parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import { ExpressionWithBodyAndSymbolNode, INode, IParseMeta } from "../nodes";


const table: Readonly<Record<string, string | undefined>> = { and: "&&", or: "||" };
export function parse_common_expressions(_sym: INode, next: Token, stream: TokenStream, meta: IParseMeta): INode | undefined {
    const name: Nodes | undefined = CommonOperatorTable[next.body as CommonOperatorTableKeys];
    return name && ExpressionWithBodyAndSymbolNode(name, [_sym, __parse(advance_next(stream, end_expression), stream, meta)], table[next.body] ?? next.body);
}
