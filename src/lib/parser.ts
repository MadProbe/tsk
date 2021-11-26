// @ts-check
/** @author MadProbe#7435 */
import {
    nullish, assert_type, resetCounter, undefined, SyntaxError, includes, error_unexcepted_token, isSymbol, remove_trailing_undefined
} from "./utils/util.js";
import { Nodes, ParameterNodeKind, NodeType, Tokens, DiagnosticSeverity, ParseNodeKind } from "./enums";
import { _echo } from "./utils/_echo.js";
import { AssignmentOperatorTable } from "./utils/table.js";
import { end_expression } from "./utils/constants.js";
import { advance_next, except_next_token, type Prefix } from "./utils/advancers.js";
import {
    parse_call_expression, parse_body, parseMemberAccess, parse_common_expressions, parse_regexp,
    parse_array_expression, parse_assignment, parse_group_expression, keywords_handlers
} from "./parsers/__all__.js";
import { INode, IParseMeta, ParseMeta } from "./nodes";
import { occurrences } from "./utils/occurrences.js";
import type { IDiagnostic } from "./utils/diagnostics.js";
import type { Token, TokenStream } from "./utils/stream.js";


export type SyntaxTree = readonly INode[];
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node}
 */
export function _parse(next: Token, stream: TokenStream, meta: IParseMeta): INode {
    var parsed = __parse(next, stream, meta);
    meta.insideExpression = false;
    return parsed;
}
const indentifier = ParseNodeKind.Indentifier;
export function parse_operators(_sym: INode, stream: TokenStream, meta: IParseMeta, type: ParseNodeKind): INode {
    meta.insideExpression = true;
    var prefix: string;
    var node: INode;
    var parsed: INode | undefined;
    var next = stream.try(end_expression);
    var canBeObject = type !== ParseNodeKind.Number && type !== ParseNodeKind.String;
    var notExpressionOrIndentifier = !canBeObject || type === ParseNodeKind.Range;
    if ((next.type === Tokens.Keyword || next.type === Tokens.Symbol) && includes(["with", "to", "as"] as const, next.body)) {
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


        case "(":
        case "?.(":
            stream.confirm_try();
            // console.log("():", next);
            notExpressionOrIndentifier && pushDiagnostic(DiagnosticSeverity.RuntimeError,
                `Call on ${ type } will fail at runtime because ${ type } is not callable.`, stream);
            var args = parse_call_expression(advance_next(stream, ")", "Call expression:"), stream, meta);
            remove_trailing_undefined(args);
            return parse_operators({
                name: next.body === "(" ? Nodes.CallExpression : Nodes.OptionalCallExpression,
                type: NodeType.Expression,
                body: [_sym],
                args
            }, stream, meta, ParseNodeKind.Expression);

        case ".":
        case "[":
        case "!.":
        case "![":
        case "?.":
        case "?.[": {
            stream.confirm_try();
            const body = next.body;
            if (body === ".") {
                type === ParseNodeKind.Number && pushDiagnostic(DiagnosticSeverity.Warn,
                    `Please disambiguate normal member access expression when member access \
performed on ${ type } value by wrapping ${ type } value in parenthezis`, stream);
            }
            if (notExpressionOrIndentifier && includes(["!.", "![", "?.", "?.["] as const, body)) {
                var isDotMemberAccess = body == "!." || body == "?.";
                pushDiagnostic(DiagnosticSeverity.Warn,
                    (body == "![" || body == "!." ? "Null assertive" : "Optional") +
                    `${ isDotMemberAccess ? "" : " computed" } member access doesn't have ` +
                    `any effect when performed on ${ type } value, assertion will be stripped.`, stream);
                (next as never as string[])[1] = isDotMemberAccess ? "." : "[";
            }
            return parseMemberAccess(_sym, next, stream, meta);
        }

        case "=>":
            stream.confirm_try();
            if (type !== indentifier) {
                pushDiagnostic(DiagnosticSeverity.RuntimeError, "Arrow functions shortcut cannot contain non-symbol parameter", stream);
            }
            node = {
                name: Nodes.FunctionExpression,
                type: NodeType.Expression,
                params: [{ name: _sym.symbol!, kind: ParameterNodeKind.Normal }],
                locals: [],
                nonlocals: []
            };
            const innerMeta: IParseMeta = new ParseMeta(meta.filename, node, meta.cache);
            next = advance_next(stream, end_expression);
            if (next.type === Tokens.Operator && next.body === "{") {
                node.body = parse_body(stream, innerMeta);
            } else {
                node.body = [{
                    name: Nodes.ReturnStatment,
                    type: NodeType.Statment,
                    body: [_parse(next, stream, innerMeta)],
                    outerBody: meta.outer
                }];
            }
            return node;

        case "::":
            stream.confirm_try();
            prefix = "Argument binding expression: ";
            except_next_token(stream, Tokens.Operator, "(", prefix);
            next = advance_next(stream, ")", prefix);
            return parse_operators({
                name: Nodes.ArgumentBindingExpression,
                type: NodeType.Expression,
                body: [_sym],
                args: parse_call_expression(next, stream, meta)
            }, stream, meta, ParseNodeKind.Expression);

        case "..":
            stream.confirm_try();
            return parse_operators({
                name: Nodes.RangeValue,
                type: NodeType.Expression,
                body: [_sym, __parse(advance_next(stream, end_expression, "RangeValue expression:"), stream, meta)]
            }, stream, meta, ParseNodeKind.Expression);

        case "!":
            stream.confirm_try();
            node = parse_operators(notExpressionOrIndentifier ? _sym : {
                name: Nodes.NullAssertionExpression,
                type: NodeType.Expression,
                body: [_sym]
            }, stream, meta, ParseNodeKind.Expression);
            if (notExpressionOrIndentifier) {
                pushDiagnostic(DiagnosticSeverity.Warn,
                    `Null assertion expression doesn't have any effect on ${ type } value, ` +
                    `null assertion operator will be stripped in output`, stream);
            } else {
                __used.na = true;
            }
            return node;

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
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node | [import("./parser").Node]}
 */
export function __parse(next: Token, stream: TokenStream, meta: IParseMeta): INode {
    var _sym: INode;
    if (isSymbol(next)) {
        // next = stream.try(end_expression);
        // if (next.type === Tokens.String) {
        //     stream.confirm_try();
        //     return parse_operators({
        //         name: Nodes.CallExpression,
        //         type: NodeType.Expression,
        //         body: [_sym],
        //         args: [{
        //             name: Nodes.StringValue,
        //             type: NodeType.Expression,
        //             body: next.body
        //         }]
        //     }, stream, meta, expression__);
        // }
        // stream.cancel_try();
        return parse_operators(next.type === Tokens.Keyword ? keywords_handlers[next.body](stream, meta) : {
            name: Nodes.Symbol,
            type: NodeType.Expression,
            symbol: next.body
        }, stream, meta, indentifier);
    } else if (next.type === Tokens.Keyword) {
        assert_type<Token>(next);
        return keywords_handlers[next.body](stream, meta);
    } else if (next.type === Tokens.Number) {
        assert_type<Token>(next);
        let _temp = next.body;
        _sym = {
            name: Nodes.NumberValue,
            type: NodeType.Expression,
            symbol: _temp
        };
        return parse_operators(_sym, stream, meta, ParseNodeKind.Number);
    } else if (next.type === Tokens.String) {
        assert_type<Token>(next);
        return parse_operators({
            name: Nodes.StringValue,
            type: NodeType.Expression,
            symbol: next.body
        }, stream, meta, ParseNodeKind.String);
    } else if (next.type === Tokens.Operator && ~[";", ")", "}", ","].indexOf(next.body)) {

    } else if (next.type === Tokens.Operator) {
        if (next.body === "{") {
            return {
                name: Nodes.CodeBlock,
                type: NodeType.Statment,
                body: parse_body(stream, meta),
                outerBody: meta.outer
            };
        } else if (next.body === "(") {
            return parse_group_expression(stream, meta);
        }
        meta.insideExpression = true;
        switch (next.body) {
            case "[":
                return parse_array_expression(stream, meta);

            case "@":
                pushDiagnostic(DiagnosticSeverity.Warn, "Decorators are not emitting yet!", stream);
                next = advance_next(stream, "decorator name");
                if (isSymbol(next)) {
                    _sym = {
                        name: Nodes.Decorator,
                        type: NodeType.Expression,
                        symbol: next.body
                    };
                } else if (next.type === Tokens.Operator && next.body === "(") {
                    _sym = {
                        name: Nodes.Decorator,
                        type: NodeType.Expression
                    };
                    var body = parse_group_expression(stream, meta);
                    throw "Decorators are not finished at all!";
                } else {
                    error_unexcepted_token(next);
                }
                break;

            case "@@":
                return parse_operators({
                    name: Nodes.SymbolShortcut,
                    type: NodeType.Expression,
                    symbol: except_next_token(stream, Tokens.Symbol | Tokens.Keyword, undefined, undefined, "symbol-constructor-property").body
                }, stream, meta, ParseNodeKind.Expression);

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

/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
export function parse_expression<P extends string>(stream: import("./utils/stream.js").TokenStream, meta: IParseMeta, prefix?: Prefix<P>) {
    return __parse(advance_next(stream, end_expression, prefix), stream, meta);
}

export function _parse_and_assert_last_token<P extends string>(stream: TokenStream, meta: IParseMeta, token_type: Tokens, token_string?: string, prefix?: Prefix<P>, parse: typeof __parse = _parse) {
    var arg: INode | [INode], next: Token;
    arg = parse(advance_next(stream, end_expression, prefix), stream, meta);
    except_next_token(stream, token_type, token_string);
    return arg;
}
// var __line = 0;
// var __column = 0;
/**@type {import("./parser").Node} */
var __top_fn_node: INode;
export const diagnostics: readonly IDiagnostic[] = [];
export class Diagnostic implements IDiagnostic {
    public readonly line: number;
    public readonly column: number;
    constructor(public readonly severity: DiagnosticSeverity, public readonly message: string, { text_stream }: TokenStream = {} as never) {
        const text = text_stream?.text.slice(0, text_stream.index);
        this.line = text ? occurrences(text, '\n') + 1 : '?' as never;
        this.column = text ? text_stream?.index - text?.lastIndexOf('\n') : '?' as never;
    }
    log() {
        const level = (["Info", "Warn", "RuntimeError", "Error", "FatalError"] as Array<keyof typeof DiagnosticSeverity>)[this.severity];
        console.log(`Diagnostic[Level: ${ level }, Line: ${ this.line }, Column: ${ this.column }]:`, this.message);
    }
}
export function pushDiagnostic(severity: DiagnosticSeverity, message: string, stream?: TokenStream, _diagnostics: readonly IDiagnostic[] = diagnostics) {
    (diagnostics as IDiagnostic[]).push(new Diagnostic(severity, message, stream));
}
export var promises: Promise<SyntaxTree>[] = [];
export interface ParserOutput {
    readonly output: Readonly<INode>;
    readonly diagnostics: readonly IDiagnostic[];
    readonly __used: Readonly<Record<string, boolean>>;
}
export var __cache = true;
export var __used: Record<string, boolean>;
/**
 * @param {import("./utils/stream.js").TokenList} stream
 * @param {string} filename
 * @returns {import("./parser").ParserOutput | Promise<import("./parser").ParserOutput>}
 */
export function parse(stream: TokenStream, filename: string, cache: boolean): ParserOutput | Promise<ParserOutput> {
    resetCounter();
    __cache = cache;
    // __line = __column = 0;
    __top_fn_node = {
        name: Nodes.AsyncFunctionExpression,
        type: NodeType.Expression,
        params: [],
        locals: [],
        meta: {}
    };
    __used = {};
    const output: ParserOutput = {
        diagnostics,
        output: __top_fn_node,
        __used
    };
    __top_fn_node.body = main_parse(stream, filename, __top_fn_node, cache) as never;
    return promises.length ? Promise.all(promises).then(() => output) : output;
}
/* それは、にんげんはかたちをした〈モノ〉 */
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} filename
 * @param {import("./parser").Node} outer
 */
export function main_parse(stream: TokenStream, filename: string, outer: INode, cache: boolean, insideExpression = false): SyntaxTree {
    const parsed: INode[] = [], meta = new ParseMeta(filename, outer, cache, insideExpression);
    var next: Token;
    parse_shebang(stream, outer);
    stream.move();
    while (!nullish(next = stream.next)) {
        // try {
        // var newlines = occurrences(next[1], '\n');
        // var __line_cache = __line += newlines;
        // if (newlines <= 0) {
        //     __column = 0;
        // }
        // var __column_cache = __column += next[1].length - next[1].lastIndexOf("\n");
        try {
            var _parsed = _parse(next, stream, meta);
            _parsed && parsed.push(_parsed);
        } catch (error) {
            if (String(error).startsWith("SyntaxError") ? error + "" != last! : true) {
                var last = error + "";
                console.log(error && typeof error !== "string" && !(error instanceof SyntaxError) ?
                    DiagnosticSeverity.FatalError :
                    DiagnosticSeverity.Error, error as never);
            }
        }
        // } catch (error) {
        //     if (typeof error === "string") {
        //         throw `${ __line_cache }.${ __column_cache }:${ __line }.${ __column }::${ filename } - ${ error }`;
        //     } else {
        //         throw error;
        //     }
        // }
        stream.move();
    }
    return parsed;
}

function parse_shebang({ text_stream }: TokenStream, outer: INode) {
    var next = text_stream.move(), text = "";
    if (next === "#") {
        if (text_stream.move() === "!") {
            while ((next = text_stream.move()) !== "\n" && next !== "\r") {
                text += next;
            }
        } else text_stream.down(2);
    } else text_stream.down();
    if (__top_fn_node === outer)
        __top_fn_node.meta!.shebang = text;
}

