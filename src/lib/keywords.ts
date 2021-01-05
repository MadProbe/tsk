import { Stream, TokenStream } from "./utils/stream.js";
import {
    isArray,
    include,
    undefined,
    SyntaxError,
    randomVarName,
    includes,
    error_unexcepted_token,
    abruptify,
    assert
} from "./utils/util.js";
import { _echo } from "./utils/_echo.js";
import { FNNodeType, Nodes, ParameterNodeType, NodeType, AccessChainItemKind, Tokens, DiagnosticSeverity } from "./enums";
import { lex } from "./lexer.js";
import { Diagnostic } from "./utils/diagnostics.js";
import { meberAccessOperators, end_expression } from "./utils/constants.js";
import { _parseMemberAccess } from "./parsers/member-access.js";
import { next_and_skip_shit_or_fail } from "./utils/advancers.js";
import { parse_body } from "./parsers/body-parser.js";
import { __cache, main_parse, promises, _parse, diagnostics, parse_expression, __parse } from "./parser.js";
import { __external_var_creator } from "./parsers/__external_var.js";
import type { ParseMeta, Node, ParameterNode, ClassNode, AccessChainItem, TryStatmentNode, UsingStatmentNode } from "./nodes";

interface KeywordParsers {
    [name: string]: (stream: TokenStream, meta: ParseMeta, ...args: any[]) => Node;
}
export var keywordsHandlers = {
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    nonlocal(stream, meta) {
        if (!meta.outer.nonlocals) {
            throw "Nonlocal statment: this statment cannot be used in top-level scope!";
        }
        var next = next_and_skip_shit_or_fail(stream, "symbol");
        if (next[0] !== Tokens.Symbol) {
            error_unexcepted_token(next);
        }
        meta.outer.nonlocals.push(next[1]);
        meta.outer.locals = (meta.outer.locals as string[]).filter(sym => sym !== next[1]);
        return {
            name: Nodes.Empty,
            type: NodeType.Expression
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    include(stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "string");
        if (next[0] !== Tokens.String) {
            error_unexcepted_token(next);
        }
        var _next = next_and_skip_shit_or_fail(stream, ";");
        if (_next[0] !== Tokens.Special || _next[1] !== ";") {
            throw "Include statment must be follewed by a semicolon!";
        }
        var file = new URL(next[1], meta.filename);
        var included = include(file, __cache);
        /**
         * @param {string} included
         */
        function _(included: string) {
            var parsed = main_parse(Stream(lex(included)), file.href, meta.outer);
            node.body = parsed;
            return parsed;
        }
        var node = {
            name: Nodes.IncludeStatment,
            type: NodeType.Expression,
            // /**
            //  * @param {boolean} pretty 
            //  * @param {string} whitespace
            //  */
            // toString(pretty: boolean, whitespace: string) {
            //     var included = include(file);
            //     return typeof included === "string" ? __include_helper__(included, pretty, whitespace) : included.then(included => __include_helper__(included, pretty, whitespace));
            // }
        } as Node;
        node.body = (typeof included !== "string" ? promises[promises.push(included.then(_)) - 1] : _(included)) as any;
        return node;
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    if(stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "(");
        if (next[0] !== Tokens.Special || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        var expression = _parse(next = next_and_skip_shit_or_fail(stream, end_expression), stream, meta), expressions: Node[];
        // console.log(expression);
        if (!isArray(expression)) {
            next = next_and_skip_shit_or_fail(stream, ")");
            expression = [expression];
        } else
            next = stream.next;
        if (next[0] !== Tokens.Special || next[1] !== ")") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "{");
        if (next[0] === Tokens.Special && next[1] === "{") {
            expressions = parse_body(stream, meta);
        } else {
            expressions = [_parse(next, stream, meta) as Node];
        }
        var node = {
            name: Nodes.IfStatment,
            type: NodeType.Statment,
            body: expressions,
            args: expression[0] as unknown,
            else: undefined,
            elseif: undefined
            // /**
            //  * @param {boolean} pretty 
            //  * @param {string} whitespace
            //  */
            // toString(pretty: boolean, whitespace: string) {
            //     if (pretty) {
            //         return `if (${ expression }) ${ impl ? expressions.toString(true) : `{\n${ whitespace + "    " }${ expressions.toString(true, whitespace + "    ") }${ whitespace }\n}` }`;
            //     } else {
            //         return `if(${ expression })${ impl ? expressions.toString(false) : `{${ expressions.toString(false) }}` }`;
            //     }
            // }
        } as Node;
        try {
            next = next_and_skip_shit_or_fail(stream, "else");
        } catch (error) {
            return node;
        }
        if (next[0] === Tokens.Keyword && next[1] === "else") {
            next = next_and_skip_shit_or_fail(stream, "if");
            if (next[0] === Tokens.Keyword && next[1] === "if") {
                var parsed = keywordsHandlers.if(stream, meta);
                if (isArray(parsed)) {
                    node.elseif = parsed[0];
                    return [node];
                } else {
                    node.elseif = parsed;
                    return node;
                }
            } else if (next[0] === Tokens.Special && next[1] === "{") {
                node.else = {
                    name: Nodes.ElseStatment,
                    type: NodeType.Statment,
                    body: parse_body(stream, meta)
                };
                return node;
            } else {
                error_unexcepted_token(next);
            }
        } else {
            return [node];
        }
    },
    true() {
        return {
            name: Nodes.TrueValue,
            type: NodeType.Expression
        };
    },
    false() {
        return {
            name: Nodes.FalseValue,
            type: NodeType.Expression
        };
    },
    undefined() {
        return {
            name: Nodes.UndefinedValue,
            type: NodeType.Expression
        };
    },
    null() {
        return {
            name: Nodes.NullValue,
            type: NodeType.Expression
        };
    },
    NaN() {
        return {
            name: Nodes.NaNValue,
            type: NodeType.Expression
        };
    },
    Infinity() {
        return {
            name: Nodes.InfinityValue,
            type: NodeType.Expression
        };
    },
    arguments() {
        return {
            name: Nodes.ArgumentsObject,
            type: NodeType.Expression
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    interface(stream) {
        var prefix = _echo("Interface statment:");
        var next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        if (next[0] !== Tokens.Symbol) {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "{", prefix);
        if (next[0] !== Tokens.Special || next[1] !== "{") {
            error_unexcepted_token(next);
        }
        error_unexcepted_token([Tokens.Keyword, "interface"]);
    },
    import(stream) {
        error_unexcepted_token(stream.next);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    async(stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "fn", "Async(Generator?)Function statment:");
        if (next[0] !== Tokens.Keyword || next[1] !== "fn") {
            error_unexcepted_token(next);
        }
        return keywordsHandlers.fn(stream, { filename: meta.filename, outer: null! }, FNNodeType.Async);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    not(stream, meta) {
        return abruptify({
            name: Nodes.LiteralLogicalNotExpression,
            type: NodeType.Expression
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta));
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external_var: __external_var_creator(NodeType.Expression),
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external: __external_var_creator(NodeType.Statment),
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    fn(stream, meta, type: FNNodeType = FNNodeType.Sync) {
        type _1 = "Function statment:";
        type _2 = `Generator${ _1 }`;
        type _3 = `Async${ _1 }`;
        type _4 = `Async${ _2 }`;
        var _prefix = _echo("Function statment:");
        var _ = [
            _prefix,
            "Generator" + _prefix,
            "Async" + _prefix
        ] as string[] as [_1, _2, _3, _4];
        _[3] = "Async" + _[1] as _4;
        var prefix = _[type];
        var name = "";
        var params = [] as ParameterNode[];
        var next = next_and_skip_shit_or_fail(stream, 'symbol" | "(', prefix);
        var paramType: ParameterNodeType;
        var hasRest = false;
        var index: number;
        if (next[0] === Tokens.Operator && next[1] === "*") {
            if (type === FNNodeType.Sync) {
                type = FNNodeType.Generator;
            } else if (type === FNNodeType.Async) {
                type = FNNodeType.AsyncGenerator;
            }
            next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        } else if (type === FNNodeType.Generator || type === FNNodeType.AsyncGenerator) {
            throw `${ prefix } Unexcepted token '${ next[1] }' ('*' excepted)`;
        }
        if (next[0] === Tokens.Symbol) {
            name = next[1];
            next = next_and_skip_shit_or_fail(stream, "(", prefix);
        }
        if (next[0] !== Tokens.Special && next[1] !== "(") {
            error_unexcepted_token(next);
        }
        var node = {
            name: type as unknown,
            type: NodeType.Expression,
            params,
            symbolName: name,
            locals: [] as string[],
            nonlocals: [] as string[]
        } as Node;
        var innerMeta = { outer: node, filename: meta.filename } as ParseMeta;
        for (; ;) {
            paramType = ParameterNodeType.Normal;
            next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
            if (next[0] === Tokens.Special && next[1] === ",") {
                params.push({
                    name: "",
                    type: ParameterNodeType.Empty
                });
                continue;
            }
            if (next[0] === Tokens.Operator && next[1] === "...") {
                if (hasRest) {
                    throw SyntaxError(`Cannot append second rest parameter to ${ name ? `function ${ name }` : "anonymous function" }`);
                }
                hasRest = true;
                paramType = ParameterNodeType.Rest;
                next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
            }
            if (next[0] === Tokens.Symbol) {
                var paramNode = {
                    name: next[1],
                    type: paramType
                } as ParameterNode;
                params.push(paramNode);
                next = next_and_skip_shit_or_fail(stream, ",", prefix);

                if (next[0] === Tokens.Operator && next[1] === "=") {
                    var parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, innerMeta);
                    if (isArray(parsed)) {
                        parsed = parsed[0];
                        next = stream.next;
                    } else {
                        next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
                    }
                    paramNode.default = parsed;
                }

                if (next[0] === Tokens.Special && next[1] === ")") {
                    break;
                } else if (next[0] !== Tokens.Special && next[1] !== ",") {
                    error_unexcepted_token(next);
                }
            } else if (next[0] === Tokens.Special && next[1] === ",") {
                params.push({
                    name: "",
                    type: paramType || ParameterNodeType.Empty
                });
            } else if (next[0] === Tokens.Special && next[1] === ")") {
                break;
            } else {
                error_unexcepted_token(next);
            }
        }
        index = params.length;
        for (; index && params[--index].type === ParameterNodeType.Empty;)
            params.pop();
        // apply(console.log, console, params); // IE 8 is very old and strange shit
        next = next_and_skip_shit_or_fail(stream, "{", prefix);
        if (next[0] === Tokens.Operator && next[1] === "=>") {
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
            if (next[0] !== Tokens.Special && next[1] !== "{") {
                return abruptify(node, abruptify({
                    name: Nodes.ReturnStatment,
                    type: NodeType.Statment
                }, _parse(next, stream, innerMeta)));
            }
        }
        if (next[0] !== Tokens.Special && next[1] !== "{") {
            error_unexcepted_token(next);
        }
        node.body = parse_body(stream, innerMeta);
        return node;
    },
    class(stream, meta) {
        const type = meta.insideExpression ? NodeType.Expression : NodeType.Statment;
        const node = {
            name: Nodes.ClassExpression,
            type,
            getters: [],
            settets: [],
            props: [],
            methods: [],
            privateGetters: [],
            privateSettets: [],
            privateMethods: [],
            privateProps: [],
            mixins: []
        } as ClassNode;
        const prefix = _echo("Class expression:");
        var next = next_and_skip_shit_or_fail(stream, ["{", "symbol", "extends"].join('" | "'), prefix);
        if (next[0] === Tokens.Symbol) {
            node.symbolName = next[1];
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        }
        if (next[0] === Tokens.Keyword && next[1] === "extends") {
            var extender = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
            if (isArray(extender)) {
                node.extends = extender[0];
                next = stream.next;
            } else {
                node.extends = extender;
                next = next_and_skip_shit_or_fail(stream, "any", prefix);
            }
            if (next[0] === Tokens.Keyword && next[1] === "with") {
                while (next[0] !== Tokens.Special || next[1] !== "{") {
                    var parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
                    if (isArray(parsed)) {
                        parsed = parsed[0];
                        next = stream.next;
                    } else {
                        next = next_and_skip_shit_or_fail(stream, "any", prefix);
                    }
                    if (next[0] !== Tokens.Special || (next[1] !== "," && next[1] !== "{")) {
                        error_unexcepted_token(next);
                    }
                    node.mixins.push(parsed);
                }
            }
        }
        if (!type && !node.symbolName) {
            diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, "Class statment doesn't have a name - " +
                "a random name will be given during compilation"));
            node.symbolName = randomVarName();
        }
        if (next[0] === Tokens.Special && next[1] === "{") {
            while ((next = next_and_skip_shit_or_fail(stream, ["keyword", "symbol", "string"].join('" | "'), prefix))[1] !== "}" &&
                next[0] !== Tokens.Special) {
                if (includes([Tokens.Symbol, Tokens.String, Tokens.Keyword], next[0])) {
                    var next2 = next_and_skip_shit_or_fail(stream, ["=", "symbol", "("].join('" | "'), prefix);
                    if (next[0] === Tokens.Keyword)
                        if (next2[0] === Tokens.Symbol && includes(["get", "set", "async"] as const, next[1])) {
                        }
                }
            }
            // next = next_and_skip_shit_or_fail(stream, "}", prefix);
            // if (next[0] !== Tokens.Special || next[1] !== "}") {
            //     error_unexcepted_token(next);
            // }
        } else
            error_unexcepted_token(next);
        return node;
    },
    return(stream, meta) {
        return abruptify({
            name: Nodes.ReturnStatment,
            type: NodeType.Statment
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression, "Return statment:"), stream, meta));
    },
    yield(stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, end_expression, "Yield expression:");
        var yield_from = next[0] === Tokens.Operator && next[1] === "*";
        var expression = yield_from ?
            parse_expression(stream, meta) :
            _parse(next, stream, meta);
        return abruptify({
            name: yield_from ? Nodes.YieldFromExpression : Nodes.YieldExpression,
            type: NodeType.Expression,
            outerBody: meta.outer
        }, expression);
    },
    await(stream, meta) {
        if (meta.outer.name === Nodes.FunctionExpression) {
            diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError,
                `Using await inside Sync Function Expression will fail at runtime`));
        }
        if (meta.outer.name === Nodes.GeneratorFunctionExpression) {
            diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, `Await is not intended to be used inside Generator Functions`));
        }
        var prefix = _echo("Await expression:" as const);
        var next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        if (next[0] === Tokens.Operator && next[1] === ".") {
            next = next_and_skip_shit_or_fail(stream, ['any', 'all', 'allSettled', 'race'].join('" | "'), prefix);
            if (next[0] === Tokens.Symbol && /^(any|all(Settled)?|race)$/m.test(next[1])) {
                var expression = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
                var _ = {
                    name: Nodes.CallExpression,
                    type: NodeType.Expression,
                    body: [{
                        name: Nodes.SymbolNoPrefix,
                        type: NodeType.Expression,
                        symbolName: `p.${ next[1] }`
                    }],
                    args: [expression]
                } as any;
                if (isArray(expression)) {
                    _.args[0] = expression[0];
                    expression = [_];
                } else
                    expression = _;
            } else {
                error_unexcepted_token(next);
            }
        } else {
            expression = _parse(next, stream, meta);
        }
        return abruptify({
            name: Nodes.AwaitExpression,
            type: NodeType.Expression,
            outerBody: meta.outer
        }, expression);
    },
    this() {
        return {
            name: Nodes.SymbolNoPrefix,
            type: NodeType.Expression,
            symbolName: "this"
        };
    },
    keep(stream, meta) {
        var prefix = _echo("Keep statment:");
        var next = next_and_skip_shit_or_fail(stream, "(", prefix);
        var args = [] as Node[];
        if (next[0] !== Tokens.Special && next[1] !== "(") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        if (next[0] === Tokens.Special || next[1] !== ")") {
            while (1) {
                if (next[0] === Tokens.Special && next[1] === ")") {
                    break;
                }
                if (next[0] === Tokens.Special && next[1] === ",") {
                    next = next_and_skip_shit_or_fail(stream, end_expression);
                    continue;
                } else {
                    var next2, isConstantObject = next[0] === Tokens.Keyword && includes(["this", "arguments"] as const, next[1]),
                        arg = (isConstantObject ? keywordsHandlers[next[1]]() : {
                            name: Nodes.Symbol,
                            type: NodeType.Expression,
                            symbolName: next[1]
                        }) as Node;
                    if (!(isConstantObject || next[0] === Tokens.Symbol)) {
                        error_unexcepted_token(next);
                    }
                    next2 = next_and_skip_shit_or_fail(stream, [',', ')'].join('" | "') + meberAccessOperators.join('" | "'), prefix);
                    if (next2[0] === Tokens.Operator && includes(meberAccessOperators, next2[1])) {
                        arg = {
                            name: Nodes.MemberAccessExpression,
                            type: NodeType.Expression,
                            body: _parseMemberAccess(arg, next, stream, meta),
                        };
                    } else {
                        isConstantObject && diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError, `Assignment to "${ next[0] }" will fail at runtime!`));
                        next = next2;
                    }
                }
                args.push(arg);
                if (next[0] === Tokens.Special) {
                    if (next[1] === ")") {
                        break;
                    } else if (next[1] !== ",") {
                        error_unexcepted_token(next);
                    }
                } else
                    error_unexcepted_token(next);
                next = next_and_skip_shit_or_fail(stream, "symbol");
            }
        }
        next = next_and_skip_shit_or_fail(stream, "{");
        if (next[0] !== Tokens.Special && next[1] !== "{") {
            error_unexcepted_token(next);
        }
        var body = parse_body(stream, meta);
        return {
            name: Nodes.KeepStatment,
            type: NodeType.Statment,
            body,
            args
        };
    },
    new(stream, meta) {
        var expression = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta),
            is_array;
        if (is_array = isArray(expression)) {
            expression = expression[0];
        }
        // The logic is to intercept from parsed node last CallExpression and mutate it into NewExpression
        var node = { name: Nodes.NewExpression, type: NodeType.Expression, body: [expression] as Node[] } as Node,
            body = expression.body, intercepted: Node[] = [], expression_ = expression;
        while (expression_.type === NodeType.Expression && isArray(body)) {
            expression_ = (body[0] as Node).name ? body[0] as Node : (body[0] as AccessChainItem).body;
            intercepted.push(expression_);
            body = expression_.body;
        }
        for (var index = 0, length = intercepted.reverse().length; index < length; index++) {
            var intercepted_ = intercepted[index];
            if (intercepted_.name === Nodes.CallExpression) {
                var expressionAbove = intercepted[index + 1] || expression;
                (node.body as Node[])[0] = intercepted_;
                if (expressionAbove.name !== Nodes.MemberAccessExpression) {
                    (expressionAbove.body as Node[])[0] = node;
                } else {
                    (expressionAbove.body as AccessChainItem[])[0] = {
                        body: node,
                        kind: AccessChainItemKind.Head
                    };
                }
                return expression;
            }
        }
        return is_array ? [node] : node;
    },
    // TODO
    try(stream, meta) {
        var node = {
            name: Nodes.TryStatment,
            type: NodeType.Statment,
            catch: ["_", []],
            else: [],
            body: [],
            finally: [],
            args: []
        } as UsingStatmentNode,
            prefix = _echo("Try statment:" as const),
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        if (next[0] === Tokens.Keyword && next[1] === "using") {
            diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, `Try-Using statment isn't supported yet!`));
        }
        if (next[0] === Tokens.Special && next[1] === "{") {
            node.body = parse_body(stream, meta);
        }
        next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        nonuseless = false;
        while (next[0] === Tokens.Keyword && includes(["catch", "else", "finally"] as const, next[1])) {
            var word = next[1], toAppend = node[word], nonuseless = true;
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
            if (word === "catch" && next[0] === Tokens.Special && next[1] === "(") {
                next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
                if (next[0] !== Tokens.Symbol) {
                    error_unexcepted_token(next);
                }
                assert<Exclude<typeof toAppend, Node[]>>(toAppend);
                toAppend[0] = next[1];
                next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
                if (next[0] !== Tokens.Special || next[1] !== ")") {
                    error_unexcepted_token(next);
                }
                next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
            }
            if (next[0] !== Tokens.Special || next[1] !== "{") {
                error_unexcepted_token(next);
            }
            if (word === "catch") {
                assert<Exclude<typeof toAppend, Node[]>>(toAppend);
                toAppend[1] = parse_body(stream, meta);
            } else {
                node[word] = parse_body(stream, meta);
            }
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        }
        if (!nonuseless) {
            diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, `Try statment is useless without else, catch, finally clauses!`));
        }
        console.log(node);
        return node as unknown as Node;
    }
} as KeywordParsers as { [key: string]: (...args: any[]) => Readonly<Node> | [Readonly<Node>]; };
