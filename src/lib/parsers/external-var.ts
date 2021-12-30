import { Nodes, NodeType, Tokens } from "../enums";
import { except_next_token } from "../utils/advancers.js";
import { undefined } from "../utils/util.js";
import type { INode } from "../nodes.js";
import type { TokenStream } from "../utils/stream.js";


export function __external_var_creator(type: NodeType) {
    return function __external_var(stream: TokenStream): INode {
        const prefix = `External variable expression:`;
        except_next_token(stream, Tokens.Operator, "(", prefix);
        except_next_token(stream, Tokens.String, undefined, prefix);
        const { body } = stream.next;
        except_next_token(stream, Tokens.Operator, ")", prefix);
        return {
            name: Nodes.ExternalVariable,
            type: type,
            symbol: body
        };
    };
}
