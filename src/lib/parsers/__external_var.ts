import { error_unexcepted_token } from "../utils/util.js";
import { Nodes, NodeType, Tokens } from "../enums";
import { end_expression } from "../utils/constants.js";
import { next_and_skip_shit_or_fail } from "../utils/advancers";

export function __external_var_creator(type: NodeType) {
    return function __external_var(stream: import("../utils/stream.js").TokenStream) {
        var prefix = `External variable ${ end_expression }:`;
        var next = next_and_skip_shit_or_fail(stream, "(", prefix);
        if (next[0] !== Tokens.Special || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "string", prefix);
        if (next[0] !== Tokens.String) {
            error_unexcepted_token(next);
        }
        var name = next[1];
        next = next_and_skip_shit_or_fail(stream, ")", prefix);
        if (next[0] !== Tokens.Special || next[1] !== ")") {
            error_unexcepted_token(next);
        }
        return {
            name: Nodes.ExternalVariable,
            type: type,
            body: name
        };
    };
}
