import { AccessChainItemKind, Nodes, NodeType, ParameterNodeType } from "./enums";
import { occurrences } from "./utils/occurrences.js";
import { assert, call, includes, randomVarName, undefined } from "./utils/util.js";
import { AccessChainItem, ClassNode, Node, ParameterNode, TryStatmentNode } from "./nodes";


var __pretty = true;
var hasOwnProperty = {}.hasOwnProperty;
function assign<T extends object>(value: T, vals: Partial<T>) {
    var result = new Object(value) as T;
    for (const key in value) {
        if (call(hasOwnProperty, value, key)) {
            result[key] = vals[key]!;
        }
    }
    return result;
}
function as_expression(exp: Node) {
    if (exp.type === NodeType.Expression) {
        return exp;
    } else {
        return {
            name: Nodes.CallExpression,
            type: NodeType.Expression,
            body: [{
                name: exp.outerBody?.name ?? Nodes.FunctionExpression,
                type: NodeType.Expression,
                body: [exp]
            }],
            args: []
        } as Node;
    }
}
function isFunctionNode(node: Node) {
    return includes([
        Nodes.FunctionExpression,
        Nodes.AsyncFunctionExpression,
        Nodes.GeneratorFunctionExpression,
        Nodes.AsyncGeneratorFunctionExpression,
        Nodes.IncludeStatment, // Doesn't resresent function node, but doesn't require any ;
        Nodes.KeepStatment,
        Nodes.CodeBlock
    ] as const, node.name);
}
function isSimple(node: Node) {
    return includes([
        Nodes.Array,
        Nodes.ArgumentBindingExpression,
        Nodes.AsyncFunctionExpression,
        Nodes.AsyncGeneratorFunctionExpression,
        Nodes.BigIntValue,
        Nodes.CallExpression,
        Nodes.MemberAccessExpression,
        Nodes.FalseValue,
        Nodes.TrueValue,
        Nodes.InfinityValue,
        Nodes.NaNValue,
        Nodes.NullValue,
        Nodes.NumberValue,
        Nodes.RangeValue,
        Nodes.StringValue,
        Nodes.Symbol,
        Nodes.SymbolNoPrefix,
        Nodes.UndefinedValue,
        Nodes.ArgumentsObject
    ] as const, node.name);
}
/**
 * @param {import("./parser").Node} node 
 * @param {any} [meta] 
 */
export function _emit(node: Node, meta: any) {
    var __text = "", elementParams: ParameterNode[], elementArgs: Node[],
        length: number, index: number, body: string | Node[] | string[] | AccessChainItem[], __diff: boolean,
        quote: string, rquote: string, name: string, node_name: Nodes, _: any;
    /**
     * Inserts space into __text variable if text must be prettified
     */
    function sp() {
        __pretty && (__text += " ");
    }
    /**
     * Inserts newline into __text variable if text must be prettified
     */
    function nl() {
        __pretty && (__text += "\n");
    }
    /**
     * Inserts indentation into __text variable
     */
    function is() {
        __pretty && (__text += meta.sp);
    }
    /**
     * Lowers indentation by 4 spaces
     */
    function li() {
        meta.sp = meta.sp.slice(0, -4);
    }
    /**
     * Raises indentation by 4 spaces
     */
    function ri() {
        meta.sp += "    ";
    }
    function declare<T extends string>(name: T): T {
        (__top.params ||= []).push({
            name,
            type: ParameterNodeType.NoPrefix
        });
        return name;
    }
    function pre_emit_body() {
        var saved = __text, is_async = node_name === Nodes.AsyncFunctionExpression ||
            node_name === Nodes.AsyncGeneratorFunctionExpression;
        __text = "";
        ri();
        is_async && ri();
        emit_body();
        is_async && li();
        li();
        ([__text, saved] = [saved, __text]);
        return saved;
    }
    function emit_body(_body?: Node[]) {
        _body ||= body as Node[];
        index = 0, length = _body.length;
        for (var assigned = 0; index < length; index++) {
            if (_body[index].name !== Nodes.Empty) {
                assigned++;
                is();
                __text += _emit(_body[index], meta);
                if ((index + 1 < length || __pretty) && !isFunctionNode(_body[index])) {
                    __text += ";";
                }
                nl();
            }
        }
        if (!assigned) {
            sp();
        }
    }
    function emitChain(nodes: AccessChainItem[]): string {
        function sp() {
            __pretty && (___text += " ");
        }
        for (var index = 0, length = nodes.length, __text = ""; index < length; index++) {
            var node = nodes[index], body = node.body, nodeKind = node.kind;
            if (nodeKind === AccessChainItemKind.Head) {
                __text += _emit(body, meta);
            } else if (nodeKind === AccessChainItemKind.Normal) {
                __text += `.${ _emit(body, meta) }`;
            } else if (nodeKind === AccessChainItemKind.Computed) {
                __text += `[${ _emit(body, meta) }]`;
            } else if (nodeKind === AccessChainItemKind.Optional || nodeKind === AccessChainItemKind.OptionalComputed) {
                var randomName = randomVarName(), ___text = `(n(${ randomName }`;
                declare(randomName);
                sp();
                ___text += "=";
                sp();
                ___text += __text + ")";
                sp();
                ___text += "?";
                sp();
                ___text += "u";
                sp();
                ___text += ":";
                sp();
                nodes.splice(0, index, {
                    kind: AccessChainItemKind.Head,
                    body: {
                        name: Nodes.SymbolNoPrefix,
                        type: NodeType.Expression,
                        symbolName: randomName
                    }
                });
                nodes[1].kind = nodeKind === AccessChainItemKind.Optional ?
                    AccessChainItemKind.Normal :
                    AccessChainItemKind.Computed;
                return `${ ___text }${ emitChain(nodes) })`;
            } else {
                nodes.splice(0, index, {
                    kind: AccessChainItemKind.Head,
                    body: {
                        name: Nodes.SymbolNoPrefix,
                        type: NodeType.Expression,
                        symbolName: `__na(${ __text })`
                    }
                });
                nodes[1].kind = nodeKind === AccessChainItemKind.NormalNullAsserted ?
                    AccessChainItemKind.Normal :
                    AccessChainItemKind.Computed;
                return emitChain(nodes);
            }
        }
        return __text;
    }
    function emitSlicedArguments() {
        sp();
        __text += `__call([].slice,`;
        sp();
        __text += "arguments";
        if (index || length !== 1) {
            __text += `,`;
            sp();
            __text += -(length - index);
        }
        __text += ")[0]";
    }
    function simple_body_emit(_body?: Node[]) {
        _body ||= body as Node[];
        __text += "{";
        _body.length && nl();
        ri();
        emit_body(_body);
        li();
        length && is();
        __text += "}";
    }
    meta ??= {};
    meta.sp ??= "";
    body = node.body!;
    switch (node_name = node.name) {
        case Nodes.ArgumentsObject:
            __text += "arguments";
        case Nodes.Empty:
            break;
        case Nodes.IncludeStatment:
            assert<Node[]>(body);
            for (let index = 0, length = body.length; index < length; index++) {
                const element = body[index];
                __text += _emit(element, meta);
                if (__pretty && !isFunctionNode(body[index])) {
                    __text += ";";
                }
                if (index < length - 1) {
                    nl();
                    is();
                }
            }
            break;

        case Nodes.AsyncGeneratorFunctionExpression:
        case Nodes.GeneratorFunctionExpression:
        case Nodes.AsyncFunctionExpression:
        case Nodes.FunctionExpression:
            assert<Node[]>(body);
            __text += "function";
            if (node_name === Nodes.GeneratorFunctionExpression) {
                __text += "*";
            }
            if (node.symbolName) {
                __text += ` $${ node.symbolName }`;
            } else sp();
            __text += "(";
            var pre_emitted = pre_emit_body();
            elementParams = node.params ||= [];
            length = elementParams.length;
            index = 0;
            var hasBody = body.length > 0 || elementParams.some(element => !!element.default || element.type === ParameterNodeType.Rest);
            for (; index < length; index++) {
                let node = elementParams[index];
                var namae = node.name;
                if (node.type === ParameterNodeType.Rest) {
                    break;
                }
                if (typeof namae === "string") {
                    __text += node.name = name = `${ node.type === ParameterNodeType.NoPrefix ? "" : "$" }${ namae || randomVarName() }`;
                } else {
                    throw "Destructing parameters are not supported yet";
                    //__text += _emit(name as unknown as Node, meta);
                }
                if (index + 1 < length && elementParams[index + 1].type !== ParameterNodeType.Rest) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            sp();
            __text += "{";
            ri();
            hasBody && nl();
            if (node.locals && node.locals.length) {
                is();
                __text += `var ${ node.locals.map(local => `$${ local }`).join(`,${ __pretty ? " " : "" }`) };`;
                nl();
            }
            if (node_name === Nodes.AsyncFunctionExpression || node_name === Nodes.AsyncGeneratorFunctionExpression) {
                !hasBody && nl();
                is();
                ri();
                __text += `return __async${ node_name === Nodes.AsyncGeneratorFunctionExpression ? '_gen' : '' }(function*`;
                sp();
                __text += "()";
                sp();
                __text += "{";
                hasBody && nl();
            }
            index = 0;
            name = "";
            var hadRestParam = false;
            for (; index < length; index++) {
                let node = elementParams[index];
                namae = node.name;
                if (hadRestParam) {
                    if (typeof namae === "string") {
                        is();
                        __text += node.name = name = `${ node.type === ParameterNodeType.NoPrefix ? "" : "$" }${ namae || randomVarName() }`;
                        if (node.default) {
                            var _tempVar = randomVarName();
                            declare(_tempVar);
                            sp();
                            __text += "=";
                            sp();
                            __text += `__nl(${ _tempVar }`;
                            sp();
                            __text += "=";
                            emitSlicedArguments();
                            __text += ")";
                            sp();
                            __text += "?";
                            sp();
                            __text += _emit(node.default, meta);
                            sp();
                            __text += ":";
                            __text += `${ _tempVar })`;
                        } else {
                            sp();
                            __text += "=";
                            emitSlicedArguments();
                        }
                        __text += index + 1 < length ? "," : ";";
                        nl();
                    } else {
                        throw "Destructing parameters are not supported yet";
                        //__text += _emit(name as unknown as Node, meta);
                    }
                }
                if (node.type === ParameterNodeType.Rest) {
                    hadRestParam = true;
                    is();
                    __text += `var ${ `$${ namae || randomVarName() }` }`;
                    sp();
                    __text += "=";
                    sp();
                    __text += `__call([].slice,`;
                    sp();
                    __text += "arguments";
                    if (index || length !== 1) {
                        __text += `,`;
                        sp();
                        __text += index;
                        if (index + 1 < length) {
                            __text += `,`;
                            sp();
                            __text += -(length - index - 1);
                        }
                    }
                    __text += `)${ index + 1 < length ? "," : ";" }`;
                    nl();
                    hadRestParam = true;
                }
                if (node.default && !hadRestParam) {
                    is();
                    __text += name || (name = typeof node.name === "string" ? node.name : _emit(node.name, meta));
                    sp();
                    __text += "===";
                    sp();
                    __text += "u";
                    sp();
                    __text += "&&";
                    sp();
                    __text += `(${ name }`;
                    sp();
                    __text += "=";
                    sp();
                    __text += `${ _emit(as_expression(node.default), meta) });`;
                    nl();
                }
            }
            __text += pre_emitted;
            li();
            if (node_name === Nodes.AsyncFunctionExpression || node_name === Nodes.AsyncGeneratorFunctionExpression) {
                hasBody && is();
                __text += "},";
                sp();
                __text += "this,";
                sp();
                __text += "arguments)";
                if (__pretty) {
                    __text += ";";
                }
                nl();
                li();
                !hasBody && is();
            }
            hasBody && is();
            __text += "}";
            break;

        case Nodes.FalseValue:
            __text += __pretty ? "false" : "!1";
            break;

        case Nodes.TrueValue:
            __text += __pretty ? "true" : "!0";
            break;

        case Nodes.UndefinedValue:
            __text += "u";
            break;

        case Nodes.NullValue:
            __text += "null";
            break;

        case Nodes.NaNValue:
            __text += "0/0";
            break;

        case Nodes.InfinityValue:
            __text += __pretty ? "Infinity" : "1/0";
            break;

        case Nodes.Symbol:
            __text += `$${ node.symbolName }`;
            break;

        case Nodes.SymbolNoPrefix:
            __text += node.symbolName;
            break;

        case Nodes.NumberValue:
            assert<string>(body);
            __text += body;
            break;

        case Nodes.ThrowExpression:
            assert<[Node]>(body);
            __text += `__throw(${ _emit(body[0], meta) })`;
            break;

        case Nodes.StringValue:
            assert<string>(body);
            __diff = occurrences(body, "'") >= occurrences(body, '"'), quote = __diff ? '"' : "'", rquote = __diff ? "'" : '"';
            __text += `${ quote }${ body.replace("\\" + rquote, rquote).replace("\n", "\\n") }${ quote }`;
            break;

        case Nodes.PipelineExpression:
            assert<[Node, Node]>(body);
            name = randomVarName();
            __text += _emit({
                name: Nodes.CallExpression,
                type: NodeType.Expression,
                body: [{
                    name: node.outerBody?.name ?? Nodes.FunctionExpression, // async? generator? function node
                    type: NodeType.Expression,
                    params: [{
                        name,
                        type: ParameterNodeType.Normal
                    }],
                    body: [{
                        name: Nodes.ReturnStatment,
                        type: NodeType.Statment,
                        body: [body[0]]
                    }]
                }],
                args: [body[1]]
            } as Node, __pretty);
            break;

        case Nodes.CallExpression:
            assert<Node[]>(body);
            __text += _emit(body[0], meta);
            __text += "(";
            elementArgs = node.args!;
            length = elementArgs.length;
            index = 0;
            for (; index < length; index++) {
                let node = elementArgs[index];
                __text += _emit(node, meta);
                if (index + 1 < length) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            break;

        case Nodes.GroupExpression:
            assert<Node[]>(body);
            __text += "(";
            length = body.length;
            index = 0;
            for (; index < length; index++) {
                let node = body[index];
                __text += _emit(as_expression(node), meta);
                if (index + 1 < length) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            break;

        case Nodes.ReturnStatment:
            assert<[Node]>(body);
            __text += "return " + _emit(as_expression(body[0]), meta);
            break;

        case Nodes.RangeValue:
            type NodeWithStringBody = Node & { body: string; };
            assert<[NodeWithStringBody, NodeWithStringBody]>(body);
            var s = +body[0].body, e = +body[1].body;
            __text += s === e ? "(function*(){})()" :
                `(function*(){for(var i=${ s },e=${ e };i${ s > e ? ">" : "<" }e;i${ s > e ? "--" : "++" })yield i})()`;
            break;

        case Nodes.ExternalVariable:
            assert<string>(body);
            __text += body;
            break;

        case Nodes.ExponentiationAssignmentExpression:
            assert<[Node, Node]>(body);
            __text += _emit(body[0], meta);
            sp();
            __text += "=";
            sp();

        case Nodes.ExponentiationExpression:
            assert<[Node, Node]>(body);
            __text += `Math.pow(${ _emit(body[0], meta) },`;
            sp();
            __text += `${ _emit(body[1], meta) })`;
            break;

        case Nodes.AssignmentExpression:
            assert<[Node, Node]>(body);
            // if (~[Nodes.OptionalMemberAccessExpression, Nodes.OptionalComputedMemberAccessExpression].indexOf(body[0].name)) {
            //     throw "The left-hand side of an assignment expression may not be an optional property access.";
            // }
            // if (~[Nodes.Symbol, Nodes.ComputedMemberAccessExpression, Nodes.MemberAccessExpression].indexOf(body[0].name)) {
            // }
            __text += _emit(body[0], meta);
            sp();
            __text += "=";
            sp();
            __text += _emit(as_expression(body[1]), meta);
            break;

        case Nodes.AddictionAssignmentExpression:
        case Nodes.SubstractionAssignmentExpression:
        case Nodes.MultiplicationAssignmentExpression:
        case Nodes.DivisionAssignmentExpression:
        case Nodes.RemainderAssignmentExpression:
        case Nodes.BitwiseANDAssignmentExpression:
        case Nodes.BitwiseXORAssignmentExpression:
        case Nodes.BitwiseORAssignmentExpression:
        case Nodes.LogicalNullishCoalescingAssignmentExpression:
        case Nodes.LogicalANDAssignmentExpression:
        case Nodes.LogicalORAssignmentExpression:
        case Nodes.DestructingAssignmentExpression:
        case Nodes.BitwiseLeftShiftAssignmentExpression:
        case Nodes.BitwiseRightShiftAssignmentExpression:
        case Nodes.BitwiseUnsignedRightShiftAssignmentExpression:
        case Nodes.AddictionExpression:
        case Nodes.SubstractionExpression:
        case Nodes.MultiplicationExpression:
        case Nodes.DivisionExpression:
        case Nodes.RemainderExpression:
        case Nodes.BitwiseANDExpression:
        case Nodes.BitwiseNOTExpresssion:
        case Nodes.BitwiseXORExpression:
        case Nodes.BitwiseORExpression:
        case Nodes.NullishCoalescingExpression:
        case Nodes.LogicalANDExpression:
        case Nodes.LogicalNOTExpresssion:
        case Nodes.LogicalORExpression:
        case Nodes.BitwiseLeftShiftExpression:
        case Nodes.BitwiseRightShiftExpression:
        case Nodes.BitwiseUnsignedRightShiftExpression:
        case Nodes.LooseComparison:
        case Nodes.StrictComparison:
        case Nodes.LessThanOrEqual:
        case Nodes.GreaterThanOrEqual:
        case Nodes.LessThan:
        case Nodes.GreaterThan:
            assert<[Node, Node]>(body);
            __text += _emit(body[0], meta);
            sp();
            __text += node.symbolName;
            sp();
            __text += _emit(as_expression(body[1]), meta);
            break;

        case Nodes.IfStatment:
            assert<Node[]>(body);
            __text += "if";
            sp();
            __text += "(";
            __text += _emit(as_expression(node.args as unknown as Node), meta);
            __text += ")";
            sp();
            __text += "{";
            var bodyLength = body.length;
            bodyLength && nl();
            ri();
            emit_body();
            li();
            bodyLength && is();
            __text += "}";
            if (node.else || node.elseif) {
                sp();
                __text += "else";
                if (node.elseif) {
                    __text += ` ${ _emit(node.elseif, meta) }`;
                } else {
                    sp();
                    __text += "{";
                    bodyLength = (body = node.else!.body!).length;
                    bodyLength && nl();
                    ri();
                    emit_body();
                    li();
                    bodyLength && is();
                    __text += "}";
                }
            }
            break;

        case Nodes.YieldExpression:
            assert<boolean>(_);
            assert<[Node]>(body);
            __text += "yield";
            if (_ = node.outerBody!.name === Nodes.AsyncGeneratorFunctionExpression) {
                sp();
                __text += "[1,";
                sp();
            } else {
                __text += " ";
            }
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
            break;

        case Nodes.YieldFromExpression:
            assert<boolean>(_);
            assert<[Node]>(body);
            __text += "yield*";
            if (_ = node.outerBody!.name === Nodes.AsyncGeneratorFunctionExpression) {
                sp();
                __text += "[2,";
            }
            sp();
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
            break;

        case Nodes.AwaitExpression:
            assert<boolean>(_);
            assert<[Node]>(body);
            __text += "yield";
            if (_ = node.outerBody!.name === Nodes.AsyncGeneratorFunctionExpression) {
                sp();
                __text += "[0,";
                sp();
            } else {
                __text += ` `;
            }
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
            break;

        case Nodes.MemberAccessExpression:
            assert<AccessChainItem[]>(body);
            __text += emitChain(body);
            break;

        // case Nodes.MemberAccessExpression:
        //     assert<[Node, Node]>(body);
        //     __text += _emit(body[0], meta) + ".";
        //     if (body[1].name !== Nodes.Symbol && body[1].name !== Nodes.SymbolNoPrefix) {
        //         (body[1].body![0] as Node).name = Nodes.SymbolNoPrefix;
        //     }
        //     if (body[1].name === Nodes.Symbol) {
        //         body[1].name = Nodes.SymbolNoPrefix;
        //     }
        //     __text += _emit(body[1], meta);
        //     // console.log(__text);
        //     break;

        // case Nodes.ComputedMemberAccessExpression:
        //     assert<[Node, Node]>(body);
        //     __text += `${ _emit(body[0], meta) }[${ _emit(body[1], meta) }]`;
        //     // console.log(__text);
        //     break;

        case Nodes.Array:
            assert<Node[]>(body);
            __text += `[${ body.map(node => _emit(as_expression(node), meta)).join(`,${ __pretty ? " " : "" }`) }]`;
            break;

        case Nodes.ArgumentBindingExpression:
            assert<[Node]>(body);
            __text += `__bind(${ _emit(body[0], meta) },`;
            sp();
            __text += `u,`;
            sp();
            __text += `${ node.args!.map(node => _emit(as_expression(node), meta)).join(`,${ __pretty ? " " : "" }`) })`;
            break;

        case Nodes.LiteralLogicalNotExpression:
            assert<[Node]>(body);
            assert<string>(_);
            _ = _emit(body[0], meta);
            __text += `!${ isSimple(body[0]) ? _ : `(${ as_expression(_) })` }`;
            break;

        case Nodes.KeepStatment:
            assert<Node[]>(body);
            elementArgs = node.args!;
            bodyLength = body.length;
            var declared = elementArgs.map((arg, index) => {
                var name = randomVarName();
                declare(name);
                index && is();
                __text += name;
                sp();
                __text += "=";
                sp();
                __text += `${ _emit(arg, meta) };`;
                nl();
                return name;
            });
            emit_body();
            __pretty || (__text += ";");
            length = elementArgs.length;
            for (var index = 0; index < length; index++) {
                index && nl();
                is();
                var tempVar = declared[index];
                __text += _emit(elementArgs[index], meta);
                sp();
                __text += "=";
                sp();
                __text += tempVar + ";";
            }
            break;

        case Nodes.CodeBlock:
            simple_body_emit();
            break;

        case Nodes.NullAssertionExpression:
            assert<[Node]>(body);
            __text += `__na(${ _emit(as_expression(body[0]), meta) })`;
            break;

        case Nodes.NewExpression:
            assert<[Node]>(body);
            __text += "new " + _emit(as_expression(body[0]), meta);
            break;

        case Nodes.TryStatment:
            assert<TryStatmentNode>(node);
            assert<Node[]>(body);
            __text += "try";
            sp();
            namae = node.else ? declare(randomVarName()) : "";
            simple_body_emit(namae ? [{
                name: Nodes.AssignmentExpression,
                type: NodeType.Expression,
                body: [
                    { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: namae },
                    { name: Nodes.TrueValue, type: NodeType.Expression }
                ]
            } as Node].concat(body || []) : undefined);
            if (node.catch) {
                sp();
                __text += "catch";
                sp();
                __text += `(${ node.catch[0] ? `$${ node.catch[0] }` : "_" })`;
                sp();
                simple_body_emit(node.else ? [{
                    name: Nodes.AssignmentExpression,
                    type: NodeType.Expression,
                    body: [
                        { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: namae },
                        { name: Nodes.FalseValue, type: NodeType.Expression }
                    ]
                } as Node].concat(node.catch[1]) : node.catch[1]);
            }
            if (node.finally || namae) {
                sp();
                __text += "finally";
                sp();

                simple_body_emit(namae ? [{
                    name: Nodes.TryStatment,
                    type: NodeType.Statment,
                    body: [{
                        name: Nodes.IfStatment,
                        type: NodeType.Statment,
                        body: node.else,
                        args: { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbolName: namae }
                    }],
                    finally: node.finally || []
                } as TryStatmentNode | { else?: Node[], catch?: TryStatmentNode["catch"]; } as unknown as Node] : node.finally);
            }
            break;

        case Nodes.WhileStatment:
            __text += "while";
            sp();
            __text += `(${ _emit(node.args![0], meta) })`;
            sp();
            simple_body_emit();
            break;

        case Nodes.DoWhileStatment:
            __text += "do";
            sp();
            simple_body_emit();
            sp();
            __text += "while";
            sp();
            __text += `(${ _emit(node.args![0], meta) })`;
            break;

        case undefined: {
            const sp = meta.sp + "    ";
            __text += `/*\n${ sp }Cannot emit undefined, has something gone wrong?` +
                `\n${ sp }Stack trace:\n${ sp + Error().stack?.replace(/\n/g, `\n${ sp }`) }\n${ meta.sp }*/`;
            break;
        }

        case Nodes.ClassExpression:
            assert<ClassNode>(node);
            console.log(node);

        default:
            __text += `/*cannot emit node Nodes[${ node_name }]*/`;
            break;
    }
    assert<string>(__text.toString());
    return __text;
}
export interface EmitterOptions {
    pretty?: boolean;
    url?: string;
}
var __top: Node;
/**
 * @param {import("./parser").Node} node 
 * @param {import("./emitter").EmitterOptions} opts
 */
export function emit(node: Node, { pretty = false, url = "" }: EmitterOptions = {}) {
    __pretty = pretty;

    // console.log(inspect(node, !0, 1 / 0, !0));
    return _emit(__top = node, { url });
}
