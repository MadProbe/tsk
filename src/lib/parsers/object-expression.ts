import { Nodes, NodeType, Tokens } from "../enums.js";
import { advance_next } from "../utils/advancers.js";
import { end_expression } from "../utils/constants.js";
import { except_token } from "../utils/util.js";
import type { INode, ObjectNode, IParseMeta } from "../nodes.js";
import type { Token, TokenStream } from "../utils/stream.js";


function recursive_attrs(stream: TokenStream, next: Token, meta: IParseMeta, mods: string[]): void {
    
}
export function parse_object_expression(stream: TokenStream, meta: IParseMeta): INode {
    var node: ObjectNode = {
        name: Nodes.ObjectExpression,
        type: NodeType.Expression,
        body: []
    }, next;
    while (next = advance_next(stream, end_expression), next.type === Tokens.Operator && next.body === ",") {
        recursive_attrs(stream, next, meta, []);
    }
    except_token(next, Tokens.Operator, "}");
    return node;
}