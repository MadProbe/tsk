import { Nodes, NodeType, AccessChainItemKind, DiagnosticSeverity } from "../enums";
import { AssignmentOperatorTable, type AssignmentOperatorTableKeys } from "../utils/table.js";
import { end_expression } from "../utils/constants.js";
import { advance_next } from "../utils/advancers.js";
import { pushDiagnostic, _parse } from "../parser.js";
import type { Token, TokenStream } from "../utils/stream.js";
import type { INode, IParseMeta, AccessChainItem } from "../nodes";


export function parse_assignment(_sym: INode, next: Token, stream: TokenStream, meta: IParseMeta): INode | undefined {
    if (name = AssignmentOperatorTable[next.body as AssignmentOperatorTableKeys] as Nodes | undefined) {
        if (_sym.name === Nodes.MemberAccessExpression) {
            const body = _sym.body as AccessChainItem[];
            var name: Nodes | undefined, parsed: INode, node: INode;
            for (var index = 0; index < body.length; index++) {
                const item = body[index];
                if (item.kind === AccessChainItemKind.Optional || item.kind === AccessChainItemKind.OptionalComputed) {
                    pushDiagnostic(DiagnosticSeverity.RuntimeError,
                        `The left-hand side of an assignment expression may not be an optional property access.`, stream);
                }
            }
        }
        parsed = _parse(advance_next(stream, end_expression), stream, meta) as INode;
        node = {
            name,
            type: NodeType.Expression,
            body: [_sym, parsed],
            symbol: next.body
        };
        if (_sym.name !== Nodes.MemberAccessExpression &&
            !~meta.outer.locals!.indexOf(_sym.symbol!) &&
            !~(meta.outer.nonlocals?.indexOf(_sym.symbol!) ?? -1)) {
            meta.outer.locals!.push(_sym.symbol!);
        }
        return node;
    }
}
