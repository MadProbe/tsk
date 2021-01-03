// @ts-check
/** @author MadProbe#7435 */
import { Stream, Token, TokenList, TokenStream } from "./utils/stream.js";
import {
    nullish,
    assert,
    isArray,
    include,
    apply,
    resetCounter,
    undefined,
    _echo,
    SyntaxError,
    inspectLog,
    randomVarName,
    includes
} from "./utils/util.js";
import { FNNodeType, Nodes, ParameterNodeType, NodeType, AccessChainItemKind, Tokens, DiagnosticSeverity } from "./enums";
import { _emit } from "./emitter.js";
import { lex } from "./lexer.js";
import { CommonOperatorTable, CommonOperatorTableKeys, AssignmentOperatorTable, AssignmentOperatorTableKeys } from "./utils/table.js";
import { Diagnostic, IDiagnostic } from "./utils/diagnostics.js";


export type NodeName = Nodes;
export interface Node {
    name: NodeName;
    type: NodeType;
    body?: string | Node[] | AccessChainItem[];
    outerBody?: Node;
    params?: ParameterNode[];
    symbolName?: string;
    meta?: Record<string, unknown>;
    args?: Node[];
    locals?: string[];
    nonlocals?: string[];
    else?: Node;
    elseif?: Node;
}
export interface ClassProperty {
    name: Node;
    body: Node;
}
// @ts-ignore
export interface ClassMethod extends ClassProperty {
    body: Node[];
    decorators: Node[];
    params: ParameterNode[];
}
export interface ClassGetter extends ClassMethod {
    params: [];
}
export interface ClassSetter extends ClassMethod {
    params: [] | [ParameterNode & { type: ParameterNodeType.Normal; }];
}
export interface ClassConstructor {
    body: Node[];
    params: ParameterNode[];
}
export interface ClassNodeProperty extends ClassProperty {
    body: Node;
}
export interface ClassNodeProps {
    methods: ClassMethod[];
    getters: ClassGetter[];
    settets: ClassSetter[];
    props: [Node, Node][];
}
export interface ClassNode extends Node, Privatify<ClassNodeProps> {
    construct?: ClassConstructor;
    extends?: Node;
    mixins: Node[];
}
export interface MixinNode extends ClassNode { }
export type PrivatifyString<T extends string> = T | `private${ Capitalize<T> }`;
export type Privatify<T extends object> = { [Key in keyof T as PrivatifyString<Key extends string ? Key : never>]: T[Key]; };
export interface ParseMeta {
    insideExpression?: boolean;
    outer: Node;
    filename: string;
    [key: string]: unknown;
}
export interface ParameterNode {
    name: string | Node;
    type: ParameterNodeType;
    default?: Node;
    _meta?: any;
}
export interface AccessChainItem {
    kind: AccessChainItemKind;
    body: Node;
}
export type SyntaxTree = Node[];
const meberAccessOperators = [".", "?.", "!.", "![", "?.[", "["] as const;
function _parseMemberAccess(sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var chain = [{
        kind: AccessChainItemKind.Head,
        body: sym
    }] as AccessChainItem[];
    while (next[0] === Tokens.Operator && includes(meberAccessOperators, next[1])) {
        if (next[1] === ".") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Normal,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Computed,
                body: parsed
            });
        } else if (next[1] === "?.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.Optional,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "?.[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: AccessChainItemKind.OptionalComputed,
                body: parsed
            });
        } else if (next[1] === "!.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== Tokens.Symbol && next[0] !== Tokens.Keyword) {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: AccessChainItemKind.NormalNullAsserted,
                body: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: next[1] }
            });
        } else if (next[1] === "![") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            } else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== Tokens.Operator || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: AccessChainItemKind.ComputedNullAsserted,
                body: parsed
            });
        } else {
            break;
        }
        next = next_and_skip_shit_or_fail(stream, "any");
    }
    downgrade_next(stream);
    return chain;
}
function parseMemberAccess(sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    return _parse({
        name: Nodes.MemberAccessExpression,
        type: NodeType.Expression,
        body: _parseMemberAccess(sym, next, stream, meta),
    }, stream, meta);
}
function isNode(value: any): value is Node {
    return !isArray(value) && typeof value === "object" && !nullish(value);
}
function downgrade_next(stream: TokenStream) {
    while (~[Tokens.Whitespace, Tokens.MultilineComment, Tokens.Comment].indexOf(stream.down()[0]));
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function next_or_fail<P extends string>(stream: import("./utils/stream.js").TokenStream, end: string, prefix?: Prefix<P>) {
    stream.move();
    var next = stream.next, newlines: number;
    if (!next) {
        throw `${ prefix || "" } Unexcepted EOF - '${ end }' excepted`.trim();
    }
    // __line += newlines = occurrences(next[1], '\n');
    // if (newlines !== 0) {
    //     __column = 0;
    // }
    // __column += next[1].length - next[1].lastIndexOf("\n");
    return next;
}
type Prefix<P extends string> = string extends P ? string :
    P extends `${ infer _ } ${ "statment" | "expression" }:` ? P : never;
/**
 * @param {import("./utils/stream.js").Token} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function skip_whitespace<P extends string>(next: Token, stream: TokenStream, end: string, prefix?: Prefix<P>) {
    return next[0] === Tokens.Whitespace ? next_or_fail(stream, end, prefix) : next;
}

/**
 * shit == whitespace and comments
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function next_and_skip_shit_or_fail<P extends string>(stream: TokenStream, end: string, prefix?: Prefix<P>) {
    var _temp: Token;
    while ((_temp = skip_whitespace(next_or_fail(stream, end, prefix), stream, end, prefix))[0] === Tokens.MultilineComment || _temp[0] === Tokens.Comment) {
        var _exec = /\s*internal\:\s*(.+)/.exec(_temp[1]);
        if (_exec) {
            Function(_exec[1])();
        }
    };
    return _temp;
}
// /**
//  * @param {string} included
//  * @param {string} filename
//  * @param {boolean} pretty 
//  * @param {string} whitespace
//  */
// function __include_helper__(included: string, pretty: boolean, whitespace: string) {
//     return _emit(parse(lex(included), filename), { url: filename });
// }
export interface KeywordParsers {
    [name: string]: (stream: TokenStream, filename: string) => Node;
}
var keywordsHandlers = {
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    nonlocal(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
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
    include(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
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
    if(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
        var next = next_and_skip_shit_or_fail(stream, "(");
        if (next[0] !== Tokens.Special || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        var expression = _parse(next = next_and_skip_shit_or_fail(stream, end_expression), stream, meta), expressions: Node[];
        // console.log(expression);
        if (!isArray(expression)) {
            next = next_and_skip_shit_or_fail(stream, ")");
            expression = [expression];
        } else next = stream.next;
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
    interface(stream: import("./utils/stream.js").TokenStream) {
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
    import(stream: import("./utils/stream.js").TokenStream) {
        error_unexcepted_token(stream.next);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    async(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
        var next = next_and_skip_shit_or_fail(stream, "fn", "Async(Generator?)Function statment:");
        if (next[0] !== Tokens.Keyword || next[1] !== "fn") {
            error_unexcepted_token(next);
        }
        return keywordsHandlers.fn(stream, { filename: meta.filename, outer: null! }, FNNodeType.Async);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    not(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
        return abruptify({
            name: Nodes.LiteralLogicalNotExpression,
            type: NodeType.Expression
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta));
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external_var(stream: import("./utils/stream.js").TokenStream) {
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
            type: NodeType.Expression,
            body: name
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external(stream: import("./utils/stream.js").TokenStream) {
        var prefix = _echo("External statment:");
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
            type: NodeType.Statment,
            body: name
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    fn(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta, type: FNNodeType = FNNodeType.Sync) {
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
        for (; index && params[--index].type === ParameterNodeType.Empty;) params.pop();
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
    class(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
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
                if ([Tokens.Symbol, Tokens.String, Tokens.Keyword].indexOf(next[0])) {
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
        } else error_unexcepted_token(next);
        return node;
    },
    return(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
        return abruptify({
            name: Nodes.ReturnStatment,
            type: NodeType.Statment
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression, "Return statment:"), stream, meta));
    },
    yield(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
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
    await(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
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
                } else expression = _;
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
    keep(stream: TokenStream, meta: ParseMeta) {
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
                } else error_unexcepted_token(next);
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
    try() {
        return undefined!;
    }
} as { [key: string]: (...args: any[]) => Readonly<Node> | [Readonly<Node>]; };
/**
 * Checks if expression is an abrupt node ([Node]) and 
 * returns abrupt node with body with abrupted expression
 * else returns node with body equal to passed expression
 */
function abruptify(node: Node | [Node], expression: Node | [Node]): Node | [Node] {
    if (isArray(expression)) {
        assert<Node>(node);
        node.body = expression;
        node = [node];
    } else {
        assert<Node>(node);
        node.body = [expression];
    }
    return node;
}
function parse_common_expressions(_sym: Node, next: Token, stream: TokenStream, meta: ParseMeta) {
    var parsed: Node, node: Node, name = CommonOperatorTable[next[1] as CommonOperatorTableKeys] as Nodes | undefined;
    if (name) {
        parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta) as Node;
        node = {
            name,
            type: NodeType.Expression,
            body: [_sym, parsed],
            symbolName: next[1]
        };
        if (name === Nodes.ExponentiationExpression) {
            // Here is the logic:
            // If parsed is a common | assignment expression
            // @ts-ignore
            if (typeof parsed.symbolName === "string" && isArray(parsed.body)) {
                // 
                // @ts-ignore
                node.body[1] = parsed.body[0];
                // @ts-ignore
                parsed.body[0] = node;
            }
            return parsed;
        }
        return node;
    }
}
function parse_assignment(_sym: Node, next: Token, stream: TokenStream, meta: ParseMeta): Node | undefined {
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
const end_expression = _echo("expression");
const js_auto_variables = ["__external_var", "this", "arguments", "null", "NaN", "undefined", "Infinity", "true", "false"] as const;
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node | [import("./parser").Node]}
 */
function _parse(next: Token | Node, stream: TokenStream, meta: ParseMeta): Node | [Node] {
    var parsed = __parse(next, stream, meta);
    meta.insideExpression = false;
    return parsed;
}
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node | [import("./parser").Node]}
 */
function __parse(next: Token | Node, stream: TokenStream, meta: ParseMeta): Node | [Node] {
    var prefix: string;
    /**@type {import("./parser").Node}*/
    var node: Node;
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
        next = next_and_skip_shit_or_fail(stream, end_expression, "Number expression:");
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
                diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError,
                    "Call on number will fail at runtime because number is not callable."));
                var args = parse_call_expression(next_and_skip_shit_or_fail(stream, ")", "Call expression:"), stream, meta);
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
                    diagnostics.push(Diagnostic(DiagnosticSeverity.Warn,
                        "Please disambiguate normal member access expression when member access " +
                        "performed on number value by wrapping nubmer value in parenthezis"));
                }
                if (includes(["!.", "![", "?.", "?.["] as const, body)) {
                    var isDotMemberAccess = body == "!." || body == "?.";
                    diagnostics.push(Diagnostic(DiagnosticSeverity.Warn,
                        (body == "![" || body == "!." ? "Null assertive" : "Optional") +
                        `${ isDotMemberAccess ? "" : " computed" } member access doesn't have ` +
                        "any effect when performed on number value, assertion will be stripped."));
                    next[1] = isDotMemberAccess ? "." : "[";
                }
                return parseMemberAccess({
                    name: Nodes.GroupExpression,
                    type: NodeType.Expression,
                    body: [_sym]
                }, next, stream, meta);
            }

            case "=>":
                if (_sym.name !== Nodes.Symbol) {
                    throw SyntaxError("Arrow functions shortcut cannot contain non-symbol parameter");
                }
                node = {
                    name: Nodes.FunctionExpression,
                    type: NodeType.Expression,
                    params: [{ name: _sym.symbolName, type: ParameterNodeType.Normal }],
                    locals: [] as string[],
                    nonlocals: [] as string[]
                } as Node;
                var innerMeta = { outer: node, filename: meta.filename };
                next = next_and_skip_shit_or_fail(stream, end_expression);
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
                next = next_and_skip_shit_or_fail(stream, "(", prefix);
                if (next[0] !== Tokens.Special || next[1] !== "(") {
                    error_unexcepted_token(next);
                }
                next = next_and_skip_shit_or_fail(stream, ")", prefix);
                var args = parse_call_expression(next, stream, meta);
                return {
                    name: Nodes.ArgumentBindingExpression,
                    type: NodeType.Expression,
                    body: [_sym],
                    args
                };

            case "!":
                node = _parse(_sym, stream, meta) as Node;
                diagnostics.push(Diagnostic(DiagnosticSeverity.Warn, 
                    "Null assertion expression doesn't have any effect on number value, " +
                    "null assertion operator will be stripped in output"));
                return node as Node | [Node];

            default:
                parsed = parse_common_expressions(_sym, next, stream, meta)!;
                if (next[1] in AssignmentOperatorTable) {
                    diagnostics.push(Diagnostic(DiagnosticSeverity.RuntimeError, "Assignment on number will fail at runtime."));
                    parsed = parse_assignment(_sym, next, stream, meta)!;
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
        // @ts-ignore
    } else if (next[0] === Tokens.Range) {
        assert<Token>(next);
        var splitted = next[1].split('..');
        return {
            name: Nodes.RangeValue,
            type: NodeType.Expression,
            body: splitted.map(v => ({ name: Nodes.StringValue, type: NodeType.Expression, body: v }))
        };
        // @ts-ignore
    } else if (next[0] === Tokens.String) {
        assert<Token>(next);
        return {
            name: Nodes.StringValue,
            type: NodeType.Expression,
            body: next[1]
        };
    } else if (isNode(next) || isSymbol(next)) {
        meta.insideExpression = true;
        var parsed: Node | [Node], _sym: Node;
        if (isNode(next)) {
            _sym = next;
        } else if (next[0] === Tokens.Keyword) {
            _sym = keywordsHandlers[next[1]](stream) as Node; // Only __external_var and this handlers can be invoked here
        } else {
            _sym = {
                name: Nodes.Symbol,
                type: NodeType.Expression,
                symbolName: next[1]
            };
        }
        next = next_and_skip_shit_or_fail(stream, end_expression);
        if (next[0] === Tokens.Keyword && next[1] === "with") {
            return [_sym];
        }
        if (next[0] !== Tokens.Operator && next[0] !== Tokens.Special && next[0] !== Tokens.String) {
            error_unexcepted_token(next);
        }
        if (next[0] === Tokens.String) {
            return {
                name: Nodes.CallExpression,
                type: NodeType.Expression,
                body: [_sym],
                args: [{
                    name: Nodes.StringValue,
                    type: NodeType.Expression,
                    body: next[1]
                }]
            };
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
                var args = parse_call_expression(next_and_skip_shit_or_fail(stream, ")", "Call expression:"), stream, meta);
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
            case "?.[":
                return parseMemberAccess(_sym, next, stream, meta);

            case "=>":
                if (_sym.name !== Nodes.Symbol) {
                    throw SyntaxError("Arrow functions shortcut cannot contain non-symbol parameter");
                }
                node = {
                    name: Nodes.FunctionExpression,
                    type: NodeType.Expression,
                    params: [{ name: _sym.symbolName, type: ParameterNodeType.Normal }],
                    locals: [] as string[],
                    nonlocals: [] as string[]
                } as Node;
                var innerMeta = { outer: node, filename: meta.filename };
                next = next_and_skip_shit_or_fail(stream, end_expression);
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
                next = next_and_skip_shit_or_fail(stream, "(", prefix);
                if (next[0] !== Tokens.Special || next[1] !== "(") {
                    error_unexcepted_token(next);
                }
                next = next_and_skip_shit_or_fail(stream, ")", prefix);
                var args = parse_call_expression(next, stream, meta);
                return {
                    name: Nodes.ArgumentBindingExpression,
                    type: NodeType.Expression,
                    body: [_sym],
                    args
                };

            case "!":
                node = _parse({
                    name: Nodes.NullAssertionExpression,
                    type: NodeType.Expression,
                    body: [_sym]
                }, stream, meta) as Node;
                __used.na = true;
                return node as Node | [Node];

            default:
                parsed = parse_common_expressions(_sym, next, stream, meta) || parse_assignment(_sym, next, stream, meta)!;
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
        }
    } else if (next[0] === Tokens.Operator) {
        meta.insideExpression = true;
        switch (next[1]) {
            case "[":
                node = {
                    name: Nodes.Array,
                    type: NodeType.Expression,
                    body: []
                };
                /**@type {any} */
                var body: any = node.body;
                assert<Node[]>(body);
                while (1) {
                    next = next_and_skip_shit_or_fail(stream, end_expression);
                    if (next[0] === Tokens.Special && next[1] === ",") {
                        body.push({
                            name: Nodes.UndefinedValue,
                            type: NodeType.Expression
                        });
                        continue;
                    } else if (next[0] === Tokens.Operator && next[1] === "]") {
                        break;
                    }
                    parsed = _parse(next, stream, meta);
                    if (isArray(parsed)) {
                        next = stream.next;
                        parsed = parsed[0];
                    } else next = next_and_skip_shit_or_fail(stream, ']" or ",');
                    if ((next[0] !== Tokens.Special || next[1] !== ",") &&
                        (next[0] !== Tokens.Operator || next[1] !== ']')) {
                        error_unexcepted_token(next);
                    }
                    body.push(parsed);
                    if (next[1] === "]") {
                        break;
                    }
                }
                // trailing undefineds are needed here
                // remove_trailing_undefined(body);
                parsed = __parse(node, stream, meta);
                return parsed;
        }
    }
    return undefined!;
}

function isSymbol(next: Token) {
    return next[0] === Tokens.Symbol || next[0] === Tokens.Keyword && includes(js_auto_variables, next[1]);
}

function remove_trailing_undefined(values: Node[]) {
    for (var index = values.length; index && values[--index].name === Nodes.UndefinedValue;) values.pop();
}

function error_unexcepted_token(next: Token, rest = ""): never {
    throw SyntaxError(`Unexcepted token '${ next[1] }'${ rest }`);
}

function parse_call_expression(next: Token, stream: TokenStream, meta: ParseMeta) {
    var arg: Node | [Node], args = [] as Node[];
    if (next[0] !== Tokens.Special || next[1] !== ")") {
        while (1) {
            if (next[0] === Tokens.Special && next[1] === ")") {
                break;
            }
            if (next[0] === Tokens.Special && next[1] === ",") {
                args.push({
                    name: Nodes.UndefinedValue,
                    type: NodeType.Expression
                });
                next = next_and_skip_shit_or_fail(stream, end_expression);
                continue;
            } else {
                arg = _parse(next, stream, meta) as Node | [Node];
            }
            if (isArray(arg)) {
                next = stream.next;
                arg = arg[0];
            } else next = next_and_skip_shit_or_fail(stream, ")");
            args.push(arg);
            if (next[0] === Tokens.Special) {
                if (next[1] === ")") {
                    break;
                } else if (next[1] !== ",") {
                    error_unexcepted_token(next);
                }
            } else error_unexcepted_token(next);
            next = next_and_skip_shit_or_fail(stream, end_expression);
        }
    }
    return args;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
function parse_body(stream: TokenStream, meta: ParseMeta): Node[] {
    var next: Token = next_and_skip_shit_or_fail(stream, "}"), tokens = [] as Node[];
    //console.log(1123124);
    while ((next/*, console.log("next:", next), next*/)[0] !== Tokens.Special || next[1] !== "}") {
        // console.log(next);
        try {
            var _parsed = _parse(next, stream, meta);
            if (isArray(_parsed)) {
                _parsed[0] && tokens.push(_parsed[0]);
                next = stream.next;
                if (next[0] === Tokens.Special && next[1] === "}") {
                    break;
                }
            } else {
                _parsed && tokens.push(_parsed);
                next = next_and_skip_shit_or_fail(stream, "}");
            }
        } catch (_e) {
            if (_e === 1) {
                break;
            } else if (_e === 0) {
                break;
            } else {
                diagnostics.push(Diagnostic(DiagnosticSeverity.Error, String(_e)));
                next = next_and_skip_shit_or_fail(stream, "}");
            }
        }
    }
    return tokens;
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
function parse_expression(stream: import("./utils/stream.js").TokenStream, meta: ParseMeta) {
    return _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
}
// var __line = 0;
// var __column = 0;
/**@type {import("./parser").Node} */
var __top_fn_node: Node;
var diagnostics = [] as IDiagnostic[];
var promises = [] as Promise<Node[]>[];
export interface ParserOutput {
    output: Node;
    diagnostics: IDiagnostic[];
    __used: any;
}
var __cache = true;
var __used: any;
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
function main_parse(stream: TokenStream, filename: string, outer: Node) {
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

