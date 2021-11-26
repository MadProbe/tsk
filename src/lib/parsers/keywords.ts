import {
    isArray, include, undefined, SyntaxError, random_var_name, includes,
    error_unexcepted_token, assert_type, except_token
} from "../utils/util.js";
import { _echo } from "../utils/_echo.js";
import { FunctionNodeKind, Nodes, ParameterNodeKind, NodeType, AccessChainItemKind, Tokens, DiagnosticSeverity } from "../enums";
import { lex } from "../lexer.js";
import { meberAccessOperators, end_expression } from "../utils/constants.js";
import { _parseMemberAccess } from "./member-access.js";
import { advance_next, except_next_token } from "../utils/advancers.js";
import { parse_body, parse_next_body } from "./body-parser.js";
import { __cache, main_parse, promises, _parse, __parse, __used, _parse_and_assert_last_token, pushDiagnostic } from "../parser.js";
import { __external_var_creator } from "./external-var.js";
import { parse_call_expression } from "./call-expression.js";
import { type IParseMeta, type INode, type IParameterNode, type IClassNode, type AccessChainItem, type IUsingStatmentNode, ParseMeta, ParameterNode } from "../nodes";
import type { TokenStream } from "../utils/stream.js";

type KeywordParsers = Readonly<Record<string, (stream: TokenStream, meta: IParseMeta, ...args: readonly unknown[]) => Readonly<INode>>>;
export var keywords_handlers = {
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    nonlocal(stream, meta) {
        if (!meta.outer.nonlocals) {
            throw "Nonlocal statment: this statment cannot be used in top-level scope!";
        }
        const next = except_next_token(stream, Tokens.Symbol);
        meta.outer.nonlocals.push(next.body);
        meta.outer.locals = meta.outer.locals!.filter(sym => sym !== next.body);
        return {
            name: Nodes.Empty,
            type: NodeType.Ephemerial
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    include(stream, meta) {
        var next = advance_next(stream, `string" | "{`), node: INode, file: URL;
        if (next.type === Tokens.String) {
            node = {
                name: Nodes.IncludeStatment,
                type: NodeType.Expression
            };
        } else if (next.type === Tokens.Operator && next.body === "{") {
            node = {
                name: Nodes.NamedIncludeStatment,
                type: NodeType.Statment,
                outerBody: meta.outer
            };
            except_next_token(stream, Tokens.Operator, "}", "Include statment:");
            except_next_token(stream, Tokens.Keyword, "from", "Include statment:");
            except_next_token(stream, Tokens.String, undefined, "Include statment:");
        } else {
            error_unexcepted_token(next);
        }
        file = new URL(next.body, meta.filename);
        const included = include(file, __cache);
        /**
         * @param {string} included
         */
        function _(included: string) {
            var parsed = main_parse(lex(included), file.href, meta.outer, meta.cache);
            node.body = parsed as never;
            return parsed;
        }
        node.body = (typeof included !== "string" ? promises[promises.push(included.then(_)) - 1] : _(included)) as never;
        return node;
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    if(stream, meta) {
        except_next_token(stream, Tokens.Operator, "(");
        var expression = _parse_and_assert_last_token(stream, meta, Tokens.Operator, ")"), expressions: INode[];
        var next = advance_next(stream, "{");
        if (next.type === Tokens.Operator && next.body === "{") {
            expressions = parse_body(stream, meta);
        } else {
            expressions = [_parse(next, stream, meta) as INode];
        }
        var node: INode = {
            name: Nodes.IfStatment,
            type: NodeType.Statment,
            body: expressions,
            args: [expression],
            else: undefined!,
            elseif: undefined!,
            outerBody: meta.outer
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
        };
        try {
            next = stream.try("else");
        } catch (error) {
            return node;
        }
        if (next.type === Tokens.Keyword && next.body === "else") {
            stream.confirm_try();
            next = advance_next(stream, "if");
            if (next.type === Tokens.Keyword && next.body === "if") {
                node.elseif = keywords_handlers.if(stream, meta);
            } else  {
                node.else = {
                    name: Nodes.ElseStatment,
                    type: NodeType.Statment,
                    body: next.type === Tokens.Operator && next.body === "{" ? parse_body(stream, meta) : [_parse(next, stream, meta) as INode],
                    outerBody: meta.outer
                };
            }
        } else {
            stream.cancel_try();
        }
        return node;
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
    // /**
    //  * @param {import("./utils/stream.js").TokenStream} stream
    //  */
    // interface(stream) {
    //     // const prefix = "Interface statment:";
    //     // var next = advance_next(stream, "symbol", prefix);
    //     // if (next[0] !== Tokens.Symbol) {
    //     //     error_unexcepted_token(next);
    //     // }
    //     // next = advance_next(stream, "{", prefix);
    //     // if (next[0] !== Tokens.Special || next[1] !== "{") {
    //     //     error_unexcepted_token(next);
    //     // }
    //     assert<0>(0, "");
    // },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    async(stream, meta) {
        except_next_token(stream, Tokens.Keyword, "fn", "Async(Generator?)Function statment:");
        return keywords_handlers.fn(stream, meta, FunctionNodeKind.Async);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    not(stream, meta) {
        return {
            name: Nodes.LiteralLogicalNotExpression,
            type: NodeType.Expression,
            body: [__parse(advance_next(stream, end_expression), stream, meta)]
        };
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
    fn(stream, meta, type: FunctionNodeKind = FunctionNodeKind.Sync) {
        type _1 = "Function statment:";
        type _2 = `Generator${ _1 }`;
        type _3 = `Async${ _1 }`;
        type _4 = `Async${ _2 }`;
        var _prefix = "Function statment:";
        var _ = [
            _prefix,
            "Generator" + _prefix,
            "Async" + _prefix
        ] as string[] as [_1, _2, _3, _4];
        _[3] = "Async" + _[1] as _4;
        const prefix = _[type];
        var name = "";
        var params: IParameterNode[] = [];
        var next = advance_next(stream, 'symbol" | "(', prefix);
        var paramType: ParameterNodeKind;
        var hasRest = false;
        var index: number;
        if (next.type === Tokens.Operator && next.body === "*") {
            if (type === FunctionNodeKind.Sync) {
                type = FunctionNodeKind.Generator;
            } else if (type === FunctionNodeKind.Async) {
                type = FunctionNodeKind.AsyncGenerator;
            }
            next = advance_next(stream, "symbol", prefix);
        } else if (type === FunctionNodeKind.Generator || type === FunctionNodeKind.AsyncGenerator) {
            throw `${ prefix } Unexcepted token '${ next.body }' ('*' excepted)`;
        }
        if (next.type === Tokens.Symbol) {
            name = next.body;
            next = advance_next(stream, "(", prefix);
        }
        if (next.type !== Tokens.Operator && next.body !== "(") {
            error_unexcepted_token(next);
        }
        const node: INode = {
            name: type as never,
            type: NodeType.Expression,
            params,
            symbol: name,
            locals: [],
            nonlocals: []
        };
        const innerMeta: IParseMeta = new ParseMeta(meta.filename, node, meta.cache);
        for (; ;) {
            paramType = ParameterNodeKind.Normal;
            next = advance_next(stream, "symbol", prefix);
            if (next.type === Tokens.Operator && next.body === ",") {
                params.push(new ParameterNode("", ParameterNodeKind.Empty, undefined));
                continue;
            }
            if (next.type === Tokens.Operator && next.body === "...") {
                if (hasRest) {
                    throw SyntaxError(`Cannot append second rest parameter to ${ name ? `function ${ name }` : "anonymous function" }`);
                }
                hasRest = true;
                paramType = ParameterNodeKind.Rest;
                next = advance_next(stream, "symbol", prefix);
            }
            if (next.type === Tokens.Symbol) {
                const { body } = next;
                next = advance_next(stream, ",", prefix);

                if (next.type === Tokens.Operator && next.body === "=") {
                    var parsed = _parse(advance_next(stream, end_expression, prefix), stream, innerMeta);
                    next = advance_next(stream, end_expression, prefix);
                }
                params.push(new ParameterNode(body, paramType, parsed!));

                if (next.type === Tokens.Operator && next.body === ")") {
                    break;
                } else if (next.type !== Tokens.Operator && next.body !== ",") {
                    error_unexcepted_token(next);
                }
            } else if (next.type === Tokens.Operator && next.body === ",") {
                params.push(new ParameterNode("", paramType || ParameterNodeKind.Empty, undefined));
            } else if (next.type === Tokens.Operator && next.body === ")") {
                break;
            } else {
                error_unexcepted_token(next);
            }
        }
        index = params.length;
        for (; index && params[--index].kind === ParameterNodeKind.Empty;)
            params.pop();
        // apply(console.log, console, params); // IE 8 is very old and strange shit
        next = advance_next(stream, "{", prefix);
        if (next.type === Tokens.Operator && next.body === "=>") {
            next = advance_next(stream, end_expression, prefix);
            innerMeta.insideExpression = true;
            if (next.type !== Tokens.Operator && next.body !== "{") {
                node.body = [{
                    name: Nodes.ReturnStatment,
                    type: NodeType.Statment,
                    body: [_parse(next, stream, innerMeta)],
                    outerBody: node
                }];
                return node;
            }
        }
        except_token(next, Tokens.Operator, "{");
        node.body = parse_body(stream, innerMeta);
        return node;
    },
    class(stream, meta) {
        const type = meta.insideExpression ? NodeType.Expression : NodeType.Statment;
        const node: IClassNode = {
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
            mixins: [],
            outerBody: meta.outer
        };
        const prefix = "Class expression:";
        var next = advance_next(stream, ["{", "symbol", "extends"].join('" | "'), prefix);
        if (next.type === Tokens.Symbol) {
            node.symbol = next.body;
            next = advance_next(stream, end_expression, prefix);
        }
        if (next.type === Tokens.Keyword && next.body === "extends") {
            var extender = _parse(advance_next(stream, end_expression, prefix), stream, meta);
            node.extends = extender;
            next = advance_next(stream, "any", prefix);
            if (next.type === Tokens.Keyword && next.body === "with") {
                while (next.type !== Tokens.Operator || next.body !== "{") {
                    var parsed = _parse(advance_next(stream, end_expression, prefix), stream, meta);
                    next = advance_next(stream, "any", prefix);
                    if (next.type !== Tokens.Operator || (next.body !== "," && next.body !== "{")) {
                        error_unexcepted_token(next);
                    }
                    node.mixins.push(parsed);
                }
            }
        }
        if (!type && !node.symbol) {
            pushDiagnostic(DiagnosticSeverity.Warn, "Class statment doesn't have a name - a random name will be given during compilation", stream);
            node.symbol = random_var_name();
        }
        if (next.type === Tokens.Operator && next.body === "{") {
            while ((next = advance_next(stream, ["keyword", "symbol", "string"].join('" | "'), prefix)).body !== "}" &&
                next.type !== Tokens.Operator) {
                if (includes([Tokens.Symbol, Tokens.String, Tokens.Keyword], next.type)) {
                    var next2 = advance_next(stream, ["=", "symbol", "("].join('" | "'), prefix);
                    if (next.type === Tokens.Keyword)
                        if (next2.type === Tokens.Symbol && includes(["get", "set", "async"] as const, next.body)) {
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
        return {
            name: Nodes.ReturnStatment,
            type: NodeType.Statment,
            body: [_parse(advance_next(stream, end_expression, "Return statment:"), stream, meta)],
            outerBody: meta.outer
        };
    },
    throw(stream, meta) {
        __used.throw = true;
        return {
            name: Nodes.ThrowExpression,
            type: NodeType.Expression,
            body: [__parse(advance_next(stream, end_expression, "Throw statment:"), stream, meta)]
        };
    },
    yield(stream, meta) {
        var next = advance_next(stream, end_expression, "Yield expression:");
        var yield_from = next.type === Tokens.Operator && next.body === "*";
        var expression = yield_from ?
            __parse(advance_next(stream, end_expression), stream, meta) :
            __parse(next, stream, meta);
        return {
            name: yield_from ? Nodes.YieldFromExpression : Nodes.YieldExpression,
            type: NodeType.Expression,
            outerBody: meta.outer,
            body: [expression]
        };
    },
    await(stream, meta) {
        if (meta.outer.name === Nodes.FunctionExpression) {
            pushDiagnostic(DiagnosticSeverity.RuntimeError, `Using await inside Sync Function Expression will fail at runtime`, stream);
        }
        if (meta.outer.name === Nodes.GeneratorFunctionExpression) {
            pushDiagnostic(DiagnosticSeverity.Warn, `Await is not intended to be used inside Generator Functions`, stream);
        }
        const prefix = "Await expression:";
        var next = advance_next(stream, end_expression, prefix);
        if (next.type === Tokens.Operator && next.body === ".") {
            next = advance_next(stream, ['any', 'all', 'allSettled', 'race'].join('" | "'), prefix);
            if (next.type === Tokens.Symbol && /^(any|all(Settled)?|race)$/m.test(next.body)) {
                var expression = _parse(advance_next(stream, end_expression, prefix), stream, meta);
                var _: INode = {
                    name: Nodes.CallExpression,
                    type: NodeType.Expression,
                    body: [{
                        name: Nodes.SymbolNoPrefix,
                        type: NodeType.Expression,
                        symbol: `p.${ next.body }`
                    }],
                    args: [expression as never]
                };
                expression = _;
            } else {
                error_unexcepted_token(next);
            }
        } else {
            expression = _parse(next, stream, meta);
        }
        return {
            name: Nodes.AwaitExpression,
            type: NodeType.Expression,
            outerBody: meta.outer,
            body: [expression as never]
        };
    },
    this() {
        return {
            name: Nodes.SymbolNoPrefix,
            type: NodeType.Expression,
            symbol: "this"
        };
    },
    keep(stream, meta) {
        const prefix = "Keep statment:";
        const args: INode[] = [];
        except_next_token(stream, Tokens.Operator, "(");
        var next = advance_next(stream, "symbol", prefix);
        // ???
        if (next.type === Tokens.Operator || next.body !== ")") {
            while (1) {
                if (next.type === Tokens.Operator && next.body === ")") {
                    break;
                }
                if (next.type === Tokens.Operator && next.body === ",") {
                    next = advance_next(stream, end_expression);
                    continue;
                } else {
                    var next2, isConstantObject = next.type === Tokens.Keyword && includes(["this", "arguments"] as const, next.body),
                        arg: INode = (isConstantObject ? keywords_handlers[next.body]() : {
                            name: Nodes.Symbol,
                            type: NodeType.Expression,
                            symbol: next.body
                        });
                    if (!(isConstantObject || next.type === Tokens.Symbol)) {
                        error_unexcepted_token(next);
                    }
                    next2 = advance_next(stream, [',', ')'].join('" | "') + meberAccessOperators.join('" | "'), prefix);
                    if (next2.type === Tokens.Operator && includes(meberAccessOperators, next2.body)) {
                        arg = {
                            name: Nodes.MemberAccessExpression,
                            type: NodeType.Expression,
                            body: _parseMemberAccess(arg, next, stream, meta),
                        };
                    } else {
                        isConstantObject && pushDiagnostic(DiagnosticSeverity.RuntimeError, `Assignment to "${ next.type }" will fail at runtime!`, stream);
                        next = next2;
                    }
                }
                args.push(arg);
                if (next.type === Tokens.Operator) {
                    if (next.body === ")") {
                        break;
                    } else if (next.body !== ",") {
                        error_unexcepted_token(next);
                    }
                } else
                    error_unexcepted_token(next);
                next = advance_next(stream, "symbol");
            }
        }
        except_next_token(stream, Tokens.Operator, "{", prefix);
        return {
            name: Nodes.KeepStatment,
            type: NodeType.Statment,
            body: parse_body(stream, meta),
            args,
            outerBody: meta.outer
        } as INode;
    },
    new(stream, meta) {
        const expression = __parse(advance_next(stream, end_expression), stream, meta);
        // The logic is to intercept from parsed node last CallExpression and mutate it into NewExpression
        const node: INode = { name: Nodes.NewExpression, type: NodeType.Expression, body: [expression] }, intercepted: INode[] = [];
        var body = expression.body, expression_ = expression;
        while (expression_.type === NodeType.Expression && isArray(body)) {
            expression_ = (body[0] as INode).name ? body[0] as INode : (body[0] as AccessChainItem).body;
            intercepted.push(expression_);
            body = expression_.body;
        }
        for (var index = 0, length = intercepted.reverse().length; index < length; index++) {
            const intercepted_ = intercepted[index];
            if (intercepted_.name === Nodes.CallExpression) {
                const expressionAbove = intercepted[index + 1] ?? expression;
                (node.body as INode[])[0] = intercepted_;
                if (expressionAbove.name !== Nodes.MemberAccessExpression) {
                    (expressionAbove.body as INode[])[0] = node;
                } else {
                    (expressionAbove.body as AccessChainItem[])[0] = {
                        body: node,
                        kind: AccessChainItemKind.Head
                    };
                }
                return expression;
            }
        }
        return node;
    },
    // TODO
    try(stream, meta) {
        const node = {
            name: Nodes.TryStatment,
            type: NodeType.Statment,
            catch: null!,
            else: null!,
            body: null!,
            finally: null!,
            args: null!,
            outerBody: meta.outer
        } as Partial<IUsingStatmentNode>;
        var prefix: `Try${"" | "-Using"} statment:` = "Try statment:",
            next = advance_next(stream, end_expression, prefix), nonuseless = true;
        if (next.type === Tokens.Keyword && next.body === "using") {
            assert_type<IUsingStatmentNode>(node);
            node.args = [];
            prefix = "Try-Using statment:";
        }
        if (next.type === Tokens.Operator && next.body === "{") {
            node.body = parse_body(stream, meta);
        }
        next = advance_next(stream, end_expression, prefix);
        nonuseless = false;
        while (next.type === Tokens.Keyword && includes(["catch", "else", "finally"] as const, next.body)) {
            nonuseless = true;
            stream.confirm_try();
            const word = next.body, toAppend = word === "catch" ? ["", []] as IUsingStatmentNode["catch"] : undefined;
            next = stream.try(end_expression, prefix);
            if (word === "catch" && next.type === Tokens.Operator && next.body === "(") {
                stream.confirm_try();
                except_next_token(stream, Tokens.Symbol);
                toAppend![0] = stream.next.body;
                except_next_token(stream, Tokens.Operator, ")", prefix);
            } else stream.cancel_try();
            if (word === "catch") {
                toAppend![1] = parse_next_body(stream, meta);
                node[word] = toAppend!;
            } else {
                node[word] = parse_next_body(stream, meta);
            }
            next = stream.try(end_expression, prefix);
        }
        stream.cancel_try();
        if (!nonuseless) {
            pushDiagnostic(DiagnosticSeverity.Warn, `Try statment is useless without else, catch, finally clauses!`, stream);
            node.finally = [];
        }
        return node;
    },
    else(stream) {
        error_unexcepted_token(stream.next);
    },
    while(stream, meta) {
        const prefix = "While statment:";
        except_next_token(stream, Tokens.Operator, "(", prefix);
        const arg = _parse_and_assert_last_token(stream, meta, Tokens.Operator, ")", prefix);
        return {
            name: Nodes.WhileStatment,
            type: NodeType.Statment,
            body: parse_next_body(stream, meta, prefix),
            args: [arg],
            outerBody: meta.outer
        };
    },
    do(stream, meta) {
        const prefix = "Do-While statment:";
        var body = parse_next_body(stream, meta, prefix);
        except_next_token(stream, Tokens.Keyword, "while", prefix);
        except_next_token(stream, Tokens.Operator, "(", prefix);
        return {
            name: Nodes.DoWhileStatment,
            type: NodeType.Statment,
            body,
            args: [_parse_and_assert_last_token(stream, meta, Tokens.Operator, ")", prefix)],
            outerBody: meta.outer
        };
    },
    to(stream) {
        error_unexcepted_token(stream.next);
    },
    as(stream) {
        error_unexcepted_token(stream.next);
    },
    import(stream, meta): INode {
        except_next_token(stream, Tokens.Operator, "(", "Import statment:");
        return {
            name: Nodes.ImportExpression,
            type: NodeType.Expression,
            args: parse_call_expression(advance_next(stream, end_expression, "Import statment:"), stream, meta)
        };
    },
    for(stream, meta) {
        except_next_token(stream, Tokens.Symbol, "range", "For statment:");
        except_next_token(stream, Tokens.Operator, "(", "For statment:");
        return {
            name: Nodes.ForRangeStatment,
            type: NodeType.Statment,
            args: [
                _parse_and_assert_last_token(stream, meta, Tokens.Keyword, "to"),
                _parse_and_assert_last_token(stream, meta, Tokens.Keyword, "as"),
                "$" + except_next_token(stream, Tokens.Symbol, undefined, "For statment:").body
            ],
            body: (except_next_token(stream, Tokens.Operator, ")", "For statment:"), parse_next_body(stream, meta)),
            outerBody: meta.outer
        };
    }
} as KeywordParsers as Readonly<Record<string, (...args: readonly unknown[]) => Readonly<INode>>>;
