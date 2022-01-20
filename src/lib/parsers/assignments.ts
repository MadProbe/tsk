import { Nodes, DiagnosticSeverity } from "../enums";
import { AssignmentOperatorTable, type AssignmentOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { pushDiagnostic, _parse } from "../parser.js";
import { INode, type ParseMeta, ExpressionWithBodyAndSymbolNode } from "../nodes";
import { optionalChainsSet } from "./member-access.js";
import type { Token, TokenStream } from "../utils/stream.js";


export function parse_assignment(_sym: INode, next: Token, stream: TokenStream, meta: ParseMeta): INode | undefined {
    var name: Nodes | undefined;
    if (name = AssignmentOperatorTable[next.body as AssignmentOperatorTableKeys]) {
        if (optionalChainsSet.has(_sym)) {
            pushDiagnostic(DiagnosticSeverity.RuntimeError, `The left-hand side of an assignment expression may not be an optional property access.`, stream);
        }
        if (_sym.name !== Nodes.MemberAccessExpression &&
            !~meta.outer.locals!.indexOf(_sym.symbol!) &&
            !~(meta.outer.nonlocals?.indexOf(_sym.symbol!) ?? -1)) {
            meta.outer.locals!.push(_sym.symbol!);
        }
        return ExpressionWithBodyAndSymbolNode(name, [_sym, _parse(advance_next(stream, end_expression), stream, meta)], next.body);
    }
}
