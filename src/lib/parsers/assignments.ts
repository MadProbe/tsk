import { Token, TokenStream } from "../utils/stream.js";
import { Nodes, NodeType, AccessChainItemKind, DiagnosticSeverity } from "../enums";
import { AssignmentOperatorTable, AssignmentOperatorTableKeys } from "../utils/table.js";
import { Diagnostic } from "../utils/diagnostics.js";
import { end_expression } from "../utils/constants.js";
import { next_and_skip_shit_or_fail } from "../utils/advancers.js";
import { Node, ParseMeta, AccessChainItem, diagnostics, _parse } from "../parser.js";

export function parse_assignment(_sym: Node, next: Token, stream: TokenStream, meta: ParseMeta): Node | undefined {
    if (name = AssignmentOperatorTable[next[1] as AssignmentOperatorTableKeys] as Nodes | undefined) {
        if (_sym.name === Nodes.MemberAccessExpression) {
            var body = _sym.body!;
            var length = body.length;
            var name: Nodes | undefined, parsed: Node, node: Node;
            for (var index = 0, item: AccessChainItem; index < length; index++) {
                item = body[index] as AccessChainItem;
                if (item.kind === AccessChainItemKind.Optional || item.kind === AccessChainItemKind.OptionalComputed) {
                    diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError,
                        `The left-hand side of an assignment expression may not be an optional property access.`));
                }
            }
        }
        parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta) as Node;
        node = {
            name,
            type: NodeType.Expression,
            body: [_sym, parsed],
            symbolName: next[1]
        };
        if (_sym.name !== Nodes.MemberAccessExpression &&
            !~meta.outer.locals!.indexOf(_sym.symbolName!) &&
            !~(meta.outer.nonlocals?.indexOf(_sym.symbolName!) ?? -1)) {
            meta.outer.locals!.push(_sym.symbolName!);
        }
        return node;
    }
}
