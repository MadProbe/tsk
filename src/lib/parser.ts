// @ts-check
/** @author MadProbe#7435 */
import {
    reset_counter, undefined, SyntaxError, error_unexcepted_token, isSymbol, should_not_happen, fatal} from "./utils/util.js";
import { Nodes, ParameterNodeKind, NodeType, Tokens, DiagnosticSeverity, ParseNodeKind } from "./enums";
import { _echo } from "./utils/_echo.js";
import { AssignmentOperatorTable } from "./utils/table.js";
import { end_expression } from "./utils/constants.js";
import { advance_next, assert_next_token, type Prefix } from "./utils/advancers.js";
import {
    parse_call_expression, parse_body, parse_common_expressions, parse_regexp,
    parse_array_expression, parse_assignment, parse_group_expression, keywords_handlers, parse_member_access
} from "./parsers/__all__.js";
import { ConstantNodeMap, ExpressionWithBodyAndArgsNode, ExpressionWithBodyNode, INode, NumberNode, ParameterNode, ParseMeta, StatmentWithBodyNode, StringNode, SymbolNode, SymbolShortcutNode } from "./nodes";
import { occurrences } from "./utils/occurrences.js";
import { MultiValueComparer } from "./utils/comparer.js";
import type { IDiagnostic } from "./utils/diagnostics.js";
import type { Token, TokenStream } from "./utils/stream.js";



const comparer = new MultiValueComparer(";}),");
const indentifier = ParseNodeKind.Indentifier;
const unusual_member_access_operators_comparer = new MultiValueComparer(["?.", "?.["] as const);
const abruptful_nodes_comparer = new MultiValueComparer(["with", "to", "as"] as const);

var __top_fn_node: INode;
export var __used: KnownUsed;
export var promises: Promise<readonly INode[]>[] = [];
export var __cache = true;

export const diagnostics: readonly IDiagnostic[] = [];

export function _parse(next: Token, stream: TokenStream, meta: ParseMeta): INode {
    const parsed = __parse(next, stream, meta);
    meta.insideExpression = false;
    return parsed;
}

export function parse_operators(_sym: INode, stream: TokenStream, meta: ParseMeta, type: ParseNodeKind): INode {
    meta.insideExpression = true;
    var node: INode;
    var parsed: INode | undefined;
    var next = stream.try(end_expression);
    var canBeObject = type !== ParseNodeKind.Number && type !== ParseNodeKind.String;
    var notExpressionOrIndentifier = !canBeObject || type === ParseNodeKind.Range;
    if (next.type & (Tokens.Keyword | Tokens.Symbol) && abruptful_nodes_comparer.includes(next.body)) {
        stream.cancel_try();
        return _sym;
    }
    if (next.type !== Tokens.Operator && (next.type !== Tokens.Keyword || next.body !== "and" && next.body !== "or")) {
        stream.confirm_try();
        error_unexcepted_token(next);
    }
    switch (next.body) {
        case "{":
        case ")":
        case "}":
        case "]":
        case ",":
        case ";":
            stream.cancel_try();
            return _sym;

        // TODO: Chained comparisons - 2 < 3 < 4 === 2 < 3 && 3 < 4
        // case ">":
        //     const expr = parse_expression(stream, meta);
        //     const nextOperator = stream.try("operator");
        //     if (nextOperator.type === Tokens.Operator && nextOperator.body === next.body) {
        //         stream.confirm_try();
        //         // ...
        //     } else stream.cancel_try();


        case "(":
        case "?.(":
            stream.confirm_try();
            notExpressionOrIndentifier && pushDiagnostic(DiagnosticSeverity.RuntimeError,
                `Call on ${ type } will fail at runtime because ${ type } is not callable.`, stream);
            return parse_operators(ExpressionWithBodyAndArgsNode(
                next.body === "(" ? Nodes.CallExpression : Nodes.OptionalCallExpression, [_sym as never],
                parse_call_expression(advance_next(stream, ")", "Call expression:"), stream, meta) as never
            ), stream, meta, ParseNodeKind.Expression);

        case ".":
        case "[":
        case "?.":
        case "?.[": {
            stream.confirm_try();
            const body = next.body;
            if (body === ".") {
                type === ParseNodeKind.Number && pushDiagnostic(DiagnosticSeverity.Warn,
                    `Please disambiguate normal member access expression when member access \
performed on ${ type } value by wrapping ${ type } value in parenthezis`, stream);
            }
            if (notExpressionOrIndentifier && unusual_member_access_operators_comparer.includes(body)) {
                var isDotMemberAccess = body == "?.";
                pushDiagnostic(DiagnosticSeverity.Warn,
                    `Optional${ isDotMemberAccess ? "" : " computed" } member access doesn't have ` +
                    `any effect when performed on ${ type } value, assertion will be stripped.`, stream);
                // @ts-expect-error
                next.body = isDotMemberAccess ? "." : "[";
            }
            return parse_operators(parse_member_access(_sym, next, stream, meta), stream, meta, ParseNodeKind.Expression);
        }

        case "=>":
            stream.confirm_try();
            if (type !== indentifier) {
                pushDiagnostic(DiagnosticSeverity.RuntimeError, "Arrow functions shortcut cannot contain non-symbol parameter", stream);
            }
            node = {
                name: Nodes.FunctionExpression,
                type: NodeType.Expression,
                params: [new ParameterNode(_sym.symbol!, ParameterNodeKind.Normal, undefined)],
                locals: [],
                nonlocals: []
            };
            const innerMeta: ParseMeta = new ParseMeta(meta.filename, node, meta.cache);
            next = advance_next(stream, end_expression);
            if (next.type === Tokens.Operator && next.body === "{") {
                node.body = parse_body(stream, innerMeta);
            } else {
                node.body = [StatmentWithBodyNode(Nodes.ReturnStatment, [_parse(next, stream, innerMeta)], node)];
            }
            return node;

        case "::":
            stream.confirm_try();
            const prefix = "Argument binding expression:";
            assert_next_token(stream, Tokens.Operator, "(", prefix);
            next = advance_next(stream, ")", prefix);
            return parse_operators(ExpressionWithBodyAndArgsNode(
                Nodes.ArgumentBindingExpression, [_sym as never], parse_call_expression(next, stream, meta) as never
            ), stream, meta, ParseNodeKind.Expression);

        case "..":
            stream.confirm_try();
            return parse_operators(ExpressionWithBodyNode(
                Nodes.RangeExpression, [_sym, parse_expression(stream, meta, "RangeValue expression:")]
            ), stream, meta, ParseNodeKind.Expression);

        case "!":
            stream.confirm_try();
            return parse_operators(ExpressionWithBodyNode(Nodes.NullAssertionExpression, [_sym]), stream, meta, ParseNodeKind.Expression);

        default:
            stream.confirm_try();
            parsed = parse_common_expressions(_sym, next, stream, meta);
            if (next.body in AssignmentOperatorTable) {
                type === indentifier || _sym.name === Nodes.MemberAccessExpression ||
                    pushDiagnostic(DiagnosticSeverity.RuntimeError, `Assignment on ${ type } will fail at runtime.`, stream);
                parsed = parse_assignment(_sym, next, stream, meta);
            }
            if (!parsed) {
                pushDiagnostic(DiagnosticSeverity.Warn, `Operator "${ next.body }" is not supported.`, stream);
                parsed = _sym;
            }
            return parsed;
    }
}

export function __parse(next: Token, stream: TokenStream, meta: ParseMeta): INode {
    if (isSymbol(next)) {
        return parse_operators(next.type === Tokens.Keyword ? ConstantNodeMap.get(next.body) ?? should_not_happen() : SymbolNode(next.body), stream, meta, indentifier);
    } else if (next.type === Tokens.Keyword) {
        if (next.body === "__external_var") return parse_operators(keywords_handlers.__external_var(stream, meta), stream, meta, indentifier);
        return keywords_handlers[next.body]?.(stream, meta) ?? fatal(`"${ next.body }" keyword will be implemented some time later.`);
    } else if (next.type === Tokens.Number) {
        return parse_operators(NumberNode(next.body), stream, meta, ParseNodeKind.Number);
    } else if (next.type === Tokens.String) {
        return parse_operators(StringNode(next.body), stream, meta, ParseNodeKind.String);
    } else if (next.type === Tokens.Operator && !comparer.includes(next.body)) {
        if (next.body === "{") {
            return StatmentWithBodyNode(Nodes.CodeBlock, parse_body(stream, meta), meta.outer);
        }
        meta.insideExpression = true;
        switch (next.body) {
            case "(":
                return parse_group_expression(stream, meta);

            case "[":
                return parse_array_expression(stream, meta);

            case "@":
                pushDiagnostic(DiagnosticSeverity.Warn, "Decorators are not emitting yet!", stream);
                next = advance_next(stream, "decorator name");
                if (isSymbol(next)) {
                } else if (next.type === Tokens.Operator && next.body === "(") {
                    var body = parse_group_expression(stream, meta);
                    throw "Decorators are not finished at all!";
                } else {
                    error_unexcepted_token(next);
                }
                break;

            case "@@":
                return parse_operators(SymbolShortcutNode(
                    assert_next_token(stream, Tokens.Symbol | Tokens.Keyword, undefined, undefined, "symbol-constructor-property").body
                ), stream, meta, ParseNodeKind.Expression);

            case "/":
                return parse_operators(parse_regexp(stream), stream, meta, ParseNodeKind.Expression);

            case "-":
            case "+":
            case "!":
                pushDiagnostic(DiagnosticSeverity.Warn, `The operator "${ next.body }" is not supported!`, stream);
                break;


            default:
                pushDiagnostic(DiagnosticSeverity.Warn, "?????????", stream);
        }
    }
    return undefined!;
}

export function parse_expression<P extends string>(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta, prefix?: Prefix<P>) {
    return __parse(advance_next(stream, end_expression, prefix), stream, meta);
}

export function parse_and_assert_last_token<P extends string>(stream: TokenStream, meta: ParseMeta, token_type: Tokens, token_string?: string, prefix?: Prefix<P>) {
    const arg = _parse(advance_next(stream, end_expression, prefix), stream, meta);
    assert_next_token(stream, token_type, token_string);
    return arg;
}

export function _parse_and_assert_last_token<P extends string>(stream: TokenStream, meta: ParseMeta, token_type: Tokens, token_string?: string, prefix?: Prefix<P>) {
    const arg = __parse(advance_next(stream, end_expression, prefix), stream, meta);
    assert_next_token(stream, token_type, token_string);
    return arg;
}

export class Diagnostic implements IDiagnostic {
    public readonly line: number;
    public readonly column: number;
    public constructor(public readonly severity: DiagnosticSeverity, public readonly message: unknown, { text_stream }: Partial<TokenStream> = {}) {
        const text = text_stream?.text.slice(0, text_stream.index);
        this.line = text ? occurrences(text, '\n') + 1 : NaN;
        this.column = text ? text_stream?.index! - text?.lastIndexOf('\n') : NaN;
    }
    public log() {
        const level = (["Info", "Warn", "RuntimeError", "Error", "FatalError"] as const)[this.severity];
        console.log(`Diagnostic[Level: ${ level }, Line: ${ this.line }, Column: ${ this.column }]:`, this.message);
    }
}

export function pushDiagnostic(severity: DiagnosticSeverity, message: unknown, stream?: TokenStream, _diagnostics: readonly IDiagnostic[] = diagnostics) {
    (_diagnostics as IDiagnostic[]).push(new Diagnostic(severity, message, stream));
}

export interface ParserOutput {
    readonly output: Readonly<INode>;
    readonly diagnostics: readonly IDiagnostic[];
    readonly __used: Readonly<KnownUsed>;
}

class KnownUsed implements Record<string, boolean> {
    public throw: boolean = false;
    public contains: boolean = false;
    [key: string]: boolean;
}

export type { KnownUsed };

export function parse(stream: TokenStream, filename: string, cache: boolean): ParserOutput | Promise<ParserOutput> {
    reset_counter();
    __cache = cache;
    const output: ParserOutput = {
        diagnostics,
        __used: __used = new KnownUsed(),
        output: __top_fn_node = {
            name: Nodes.AsyncFunctionExpression,
            type: NodeType.Expression,
            params: [],
            locals: [],
            meta: {},
            body: undefined
        }
    };
    __top_fn_node.body = main_parse(stream, filename, __top_fn_node, cache) as never;
    return promises.length ? Promise.all(promises).then(() => output) : output;
}

/* それは、にんげんはかたちをした〈モノ〉 */
export function main_parse(stream: TokenStream, filename: string, outer: INode, cache: boolean, insideExpression: boolean = false): readonly INode[] {
    const parsed: INode[] = [], meta = new ParseMeta(filename, outer, cache, insideExpression);
    parse_shebang(stream, outer);
    for (const next of stream) {
        try {
            const _parsed = _parse(next, stream, meta);
            _parsed && parsed.push(_parsed);
        } catch (error) {
            if (String(error).startsWith("SyntaxError") ? error + "" != last! : true) {
                var last = error + "";
                console.log(error && typeof error !== "string" && !(error instanceof SyntaxError) ?
                    DiagnosticSeverity.FatalError :
                    DiagnosticSeverity.Error, error as never);
            }
        }
    }
    return parsed;
}

function parse_shebang({ text_stream }: TokenStream, outer: INode) {
    var next: string, text = "";
    if (text_stream.move() === "#") {
        if (text_stream.move() === "!") {
            while ((next = text_stream.move()) !== "\n" && next !== "\r") {
                text += next;
            }
        } else text_stream.down(2);
    } else text_stream.down(1);
    if (__top_fn_node === outer)
        __top_fn_node.meta!.shebang = text;
}
