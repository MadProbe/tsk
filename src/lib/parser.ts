// @ts-check
/** @author MadProbe#7435 */
import { Stream, Token, TokenList, TokenStream } from "./utils/stream.js";
import {
    nullish,
    assert,
    isArray,
    apply,
    resetCounter,
    undefined,
    SyntaxError,
    inspectLog,
    includes,
    error_unexcepted_token,
    isSymbol,
    remove_trailing_undefined,
    isNode,
    abruptify
} from "./utils/util.js";
import { Nodes, ParameterNodeType, NodeType, Tokens, DiagnosticSeverity, ParseNodeType } from "./enums";
import { _emit } from "./emitter.js";
import { _echo } from "./utils/_echo.js";
import { AssignmentOperatorTable } from "./utils/table.js";
import { Diagnostic, IDiagnostic } from "./utils/diagnostics.js";
import { js_auto_variables, end_expression, expression } from "./utils/constants.js";
import { parseMemberAccess } from "./parsers/member-access.js";
import { advance_next } from "./utils/advancers.js";
import { parse_call_expression } from "./parsers/call-expression.js";
import { parse_body } from "./parsers/body-parser.js";
import { parse_common_expressions } from "./parsers/common-expressions.js";
import { parse_assignment } from "./parsers/assignments.js";
import { keywordsHandlers } from "./keywords.js";
import type { Node, ParseMeta, AccessChainItem } from "./nodes";
import { parse_array_expression } from "./parsers/array-expression.js";
import { parse_group_expression } from "./parsers/group-expression.js";


export type SyntaxTree = Node[];
// /**
//  * @param {string} included
//  * @param {string} filename
//  * @param {boolean} pretty 
//  * @param {string} whitespace
//  */
// function __include_helper__(included: string, pretty: boolean, whitespace: string) {
//     return _emit(parse(lex(included), filename), { url: filename });
// }
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node | [import("./parser").Node]}
 */
export function _parse(next: Token | Node, stream: TokenStream, meta: ParseMeta): Node | [Node] {
    var parsed = __parse(next, stream, meta);
    meta.insideExpression = false;
    return parsed;
}
const indentifier = ParseNodeType.Indentifier;
function parse_operators(_sym: Node, stream: TokenStream, meta: ParseMeta, type: ParseNodeType): Node | [Node] {
    meta.insideExpression = true;
    var prefix: string;
    var node: Node;
    var parsed: Node | [Node] | undefined;
    var next = stream.next;
    var canBeObject = type !== ParseNodeType.Number && type !== ParseNodeType.String;
    var notExpressionOrIndentifier = !canBeObject || type === ParseNodeType.Range;
    if (next[0] !== Tokens.Operator && next[0] !== Tokens.Special) {
        error_unexcepted_token(next);
    }
    switch (next[1]) {
        case "{":
        case ")":
        case "}":
        case "]":
        case ",":
        case ";":
            return [_sym];


        case "(":
        case "?.(":
            // console.log("():", next);
            notExpressionOrIndentifier && diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError,
                `Call on ${ type } will fail at runtime because ${ type } is not callable.`));
            var args = parse_call_expression(advance_next(stream, ")", "Call expression:"), stream, meta);
            remove_trailing_undefined(args);
            node = {
                name: next[1] === "(" ? Nodes.CallExpression : Nodes.OptionalCallExpression,
                type: NodeType.Expression,
                body: [_sym],
                args: args
            };
            return _parse(node, stream, meta);

        case ".":
        case "[":
        case "!.":
        case "![":
        case "?.":
        case "?.[": {
            let body = next[1];
            assert<string>(_);
            if (body === ".") {
                type === ParseNodeType.Number && diagnostics.push(Diagnostic(DiagnosticSeverity.Warn,
                    `Please disambiguate normal member access expression when member access performed on ${ type } value by wrapping ${ type } value in parenthezis`));
            }
            if (notExpressionOrIndentifier && includes(["!.", "![", "?.", "?.["] as const, body)) {
                var isDotMemberAccess = body == "!." || body == "?.";
                diagnostics.push(Diagnostic(DiagnosticSeverity.Warn,
                    (body == "![" || body == "!." ? "Null assertive" : "Optional") +
                    `${ isDotMemberAccess ? "" : " computed" } member access doesn't have ` +
                    `any effect when performed on ${ type } value, assertion will be stripped.`));
                next[1] = isDotMemberAccess ? "." : "[";
            }
            return parseMemberAccess(type === ParseNodeType.Number || type === end_expression ? {
                name: Nodes.GroupExpression,
                type: NodeType.Expression,
                body: [_sym]
            } : _sym, next, stream, meta);
        }

        case "=>":
            if (type !== indentifier) {
                diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError, "Arrow functions shortcut cannot contain non-symbol parameter"));
            }
            node = {
                name: Nodes.FunctionExpression,
                type: NodeType.Expression,
                params: [{ name: _sym.symbolName, type: ParameterNodeType.Normal }],
                locals: [],
                nonlocals: []
            } as Node;
            var innerMeta = { outer: node, filename: meta.filename };
            next = advance_next(stream, end_expression);
            if (next[0] !== Tokens.Special && next[1] !== "{") {
                return abruptify(node, abruptify({
                    name: Nodes.ReturnStatment,
                    type: NodeType.Statment
                }, _parse(next, stream, innerMeta)));
            } else {
                return (node.body = parse_body(stream, innerMeta), node);
            }

        case "::":
            prefix = "Argument binding expression: ";
            next = advance_next(stream, "(", prefix);
            if (next[0] !== Tokens.Special || next[1] !== "(") {
                error_unexcepted_token(next);
            }
            next = advance_next(stream, ")", prefix);
            var args = parse_call_expression(next, stream, meta);
            return {
                name: Nodes.ArgumentBindingExpression,
                type: NodeType.Expression,
                body: [_sym],
                args
            };

        case "!":
            assert<boolean>(_);
            node = _parse(notExpressionOrIndentifier ? _sym : {
                name: Nodes.NullAssertionExpression,
                type: NodeType.Expression,
                body: [_sym]
            }, stream, meta) as Node;
            if (notExpressionOrIndentifier) {
                diagnostics.push(Diagnostic(DiagnosticSeverity.Warn,
                    `Null assertion expression doesn't have any effect on ${ type } value, ` +
                    `null assertion operator will be stripped in output`));
            } else {
                __used.na = true;
            }
            return node as Node | [Node];

        default:
            parsed = parse_common_expressions(_sym, next, stream, meta);
            if (next[1] in AssignmentOperatorTable) {
                type === indentifier || _sym.name === Nodes.MemberAccessExpression || diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError, `Assignment on ${ type } will fail at runtime.`));
                parsed = parse_assignment(_sym, next, stream, meta);
            }
            if (!parsed) {
                diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, `Operator "${ next[1] }" is not supported`));
                parsed = _sym;
            }
            var _ = parsed && parsed.body;
            if (_ && parsed.symbolName && isArray<Node | AccessChainItem>(_[1])) {
                assert<Node[] | string[] | AccessChainItem[]>(_);
                _[1] = _[1][0];
                parsed = [parsed];
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
export function __parse(next: Token | Node, stream: TokenStream, meta: ParseMeta): Node | [Node] {
    var prefix: string;
    var _sym: Node;
    var expression__ = expression as ParseNodeType.Expression;
    var type__ = expression__ as ParseNodeType;
    // @ts-ignore
    if (next[0] === Tokens.Keyword && !includes(js_auto_variables, next[1])) {
        assert<Token>(next);
        return keywordsHandlers[next[1]](stream, meta);
        // @ts-ignore
    } else if (next[0] === Tokens.Number) {
        assert<Token>(next);
        let _temp = next[1];
        _sym = {
            name: Nodes.NumberValue,
            type: NodeType.Expression,
            body: _temp
        };
        advance_next(stream, expression);
        return parse_operators(_sym, stream, meta, ParseNodeType.Number);
        // @ts-ignore
    } else if (next[0] === Tokens.Range) {
        assert<Token>(next);
        var splitted = next[1].split('..');
        advance_next(stream, expression);
        return parse_operators({
            name: Nodes.RangeValue,
            type: NodeType.Expression,
            body: splitted.map(v => ({ name: Nodes.StringValue, type: NodeType.Expression, body: v }))
        }, stream, meta, ParseNodeType.Range);
        // @ts-ignore
    } else if (next[0] === Tokens.String) {
        assert<Token>(next);
        advance_next(stream, expression);
        return parse_operators({
            name: Nodes.StringValue,
            type: NodeType.Expression,
            body: next[1]
        }, stream, meta, ParseNodeType.String);
    } else if (isNode(next) || isSymbol(next)) {
        if (isNode(next)) {
            _sym = next;
        } else {
            type__ = indentifier;
            if (next[0] === Tokens.Keyword) {
                _sym = keywordsHandlers[next[1]](stream) as Node; // Only __external_var and JS auto variable handlers can be invoked here
            } else {
                _sym = {
                    name: Nodes.Symbol,
                    type: NodeType.Expression,
                    symbolName: next[1]
                };
            }
        }
        next = advance_next(stream, expression);
        if (next[0] === Tokens.Keyword && next[1] === "with") {
            return [_sym];
        }
        if (next[0] === Tokens.String) {
            advance_next(stream, expression);
            return parse_operators({
                name: Nodes.CallExpression,
                type: NodeType.Expression,
                body: [_sym],
                args: [{
                    name: Nodes.StringValue,
                    type: NodeType.Expression,
                    body: next[1]
                }]
            }, stream, meta, expression__);
        }
        return parse_operators(_sym, stream, meta, type__);
    } else if (next[0] === Tokens.Comment || next[0] === Tokens.MultilineComment || next[0] === Tokens.Whitespace) {
        // return (void next)!;
    } else if (next[0] === Tokens.Special && ~[";", ")", "}", ","].indexOf(next[1])) {
        // throw +(next[1] === ",");
    } else if (next[0] === Tokens.Special) {
        if (next[1] === "{") {
            return {
                name: Nodes.CodeBlock,
                type: NodeType.Statment,
                body: parse_body(stream, meta)
            };
        } else if (next[1] === "(") {
            return parse_group_expression(stream, meta);
        }
    } else if (next[0] === Tokens.Operator) {
        meta.insideExpression = true;
        switch (next[1]) {
            case "[":
                return parse_array_expression(stream, meta);
        }
    }
    return undefined!;
}

/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
function parse_any(stream: TokenStream, meta: ParseMeta) {
    return null;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
export function parse_expression(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
    return _parse(advance_next(stream, end_expression), stream, meta);
}
// var __line = 0;
// var __column = 0;
/**@type {import("./parser").Node} */
var __top_fn_node: Node;
export var diagnostics = [] as IDiagnostic[];
export var promises = [] as Promise<Node[]>[];
export interface ParserOutput {
    output: Node;
    diagnostics: IDiagnostic[];
    __used: Record<string, boolean>;
}
export var __cache = true;
export var __used: any;
/**
 * @param {import("./utils/stream.js").TokenList} lexed
 * @param {string} filename
 * @returns {import("./parser").ParserOutput | Promise<import("./parser").ParserOutput>}
 */
export function parse(lexed: TokenList, filename: string, cache: boolean): ParserOutput | Promise<ParserOutput> {
    resetCounter();
    __cache = cache;
    var stream = Stream(lexed);
    // __line = __column = 0;
    __top_fn_node = {
        name: Nodes.AsyncFunctionExpression,
        type: NodeType.Expression,
        params: [{ name: "u", type: ParameterNodeType.NoPrefix }], // needed for UndefinedValue node
        locals: []
    };
    __used = {};
    __top_fn_node.body = main_parse(stream, filename, __top_fn_node);
    var output = {
        diagnostics,
        output: __top_fn_node,
        __used
    } as ParserOutput;
    return promises.length ? Promise.all(promises).then(() => output) : output;
}
/* それは、にんげんはかたちをした〈モノ〉 */
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} filename
 * @param {import("./parser").Node} outer
 */
export function main_parse(stream: TokenStream, filename: string, outer: Node) {
    var parsed = [] as Node[], next: Token;
    while (!nullish(next = stream.next)) {
        // try {
        // var newlines = occurrences(next[1], '\n');
        // var __line_cache = __line += newlines;
        // if (newlines <= 0) {
        //     __column = 0;
        // }
        // var __column_cache = __column += next[1].length - next[1].lastIndexOf("\n");
        try {
            var _parsed = _parse(next, stream, { outer, filename });
            _parsed && parsed.push(isArray(_parsed) ? _parsed[0] : _parsed);
        } catch (error) {
            diagnostics.push(Diagnostic(error && typeof error !== "string" && !(error instanceof SyntaxError) ?
                DiagnosticSeverity.FatalError :
                DiagnosticSeverity.Error, error));
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

