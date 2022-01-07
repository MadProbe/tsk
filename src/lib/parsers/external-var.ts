import { Nodes, NodeType, Tokens } from "../enums";
import { assert_next_token } from "../utils/advancers.js";
import { undefined } from "../utils/util.js";
import { type INode, Node, ParseMeta } from "../nodes.js";
import type { TokenStream } from "../utils/stream.js";


export function __external_var_creator(type: NodeType) {
    return function __external_var(stream: TokenStream, meta: ParseMeta): INode {
        const prefix = `External variable expression:`;
        assert_next_token(stream, Tokens.Operator, "(", prefix);
        assert_next_token(stream, Tokens.String, undefined, prefix);
        const { body } = stream.next;
        assert_next_token(stream, Tokens.Operator, ")", prefix);
        return new Node(Nodes.ExternalVariable, type, undefined, type === NodeType.Statment ? meta.outer : undefined, body, undefined);
    };
}
