import { AccessChainItemKind, Nodes, NodeType, ParameterNodeKind } from "./enums";
import { occurrences } from "./utils/occurrences.js";
import { assert_type, includes, random_var_name, undefined } from "./utils/util.js";
import { _echo } from "./utils/_echo.js";
import { AccessChainItem, ParameterNode } from "./nodes";
import type { IClassNode, INode, ITryStatmentNode } from "./nodes";


var __pretty = true;
var commaAndWhitespace: string;
function as_expression(exp: INode): INode {
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
        };
    }
}
function isBlockNode(node: INode) {
    return includes([
        Nodes.FunctionExpression,
        Nodes.AsyncFunctionExpression,
        Nodes.GeneratorFunctionExpression,
        Nodes.AsyncGeneratorFunctionExpression,
        Nodes.IncludeStatment,
        Nodes.KeepStatment,
        Nodes.CodeBlock,
        Nodes.TryStatment,
        Nodes.IfStatment
    ] as const, node.name);
}
function isSimple(node: INode) {
    return includes([
        Nodes.Array,
        Nodes.ArgumentBindingExpression,
        Nodes.AsyncFunctionExpression,
        Nodes.AsyncGeneratorFunctionExpression,
        Nodes.BigIntValue,
        // Nodes.CallExpression,
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
        Nodes.ArgumentsObject,
        Nodes.ExternalVariable
    ] as const, node.name);
}
/**
 * @param {import("./parser").Node} node 
 * @param {any} meta 
 */
function _emit(node: INode, meta: EmitterOptions) {
    var __text = "", elementParams: ParameterNode[], elementArgs: INode[],
        length: number, index: number, body: readonly INode[] | readonly AccessChainItem[], __diff: boolean,
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
        __pretty && (__text += meta.indentation);
    }
    /**
     * Lowers indentation by 4 spaces
     */
    function li() {
        __pretty && (meta.indentation = meta.indentation.slice(0, -4));
    }
    /**
     * Raises indentation by 4 spaces
     */
    function ri() {
        __pretty && (meta.indentation += "    ");
    }
    function declare<T extends string>(name: T): T {
        __top.params!.push(new ParameterNode(name, ParameterNodeKind.NoPrefix, undefined));
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
    function emit_body(_body: readonly INode[] = body as readonly INode[]) {
        index = 0, length = _body.length;
        for (var assigned = 0; index < length; index++) {
            const element = _body[index];
            if (element.name !== Nodes.Empty) {
                assigned++;
                is();
                __text += _emit(element, meta);
                if ((index + 1 < length || __pretty) && !isBlockNode(element)) {
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
        for (var index = 0, __text = ""; index < nodes.length; index++) {
            const node = nodes[index], body = node.body, nodeKind = node.kind;
            if (nodeKind === AccessChainItemKind.Head) {
                __text += _emit(isSimple(body) && body.name !== Nodes.NumberValue ? as_expression(body) :
                    ({ name: Nodes.GroupExpression, type: NodeType.Expression, body: [body] }), meta);
            } else if (nodeKind === AccessChainItemKind.Normal) {
                __text += `.${ _emit(body, meta) }`;
            } else if (nodeKind === AccessChainItemKind.Computed) {
                __text += `[${ _emit(body, meta) }]`;
            } else if (nodeKind === AccessChainItemKind.Optional || nodeKind === AccessChainItemKind.OptionalComputed) {
                var randomName = declare(random_var_name()), ___text = `(n(${ randomName }`;
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
                nodes.splice(0, index, new AccessChainItem(AccessChainItemKind.Head, {
                    name: Nodes.SymbolNoPrefix,
                    type: NodeType.Expression,
                    symbol: randomName
                }));
                node.kind = nodeKind === AccessChainItemKind.Optional ?
                    AccessChainItemKind.Normal :
                    AccessChainItemKind.Computed;
                return `${ ___text }${ emitChain(nodes) })`;
            } else {
                nodes.splice(0, index, new AccessChainItem(AccessChainItemKind.Head, {
                    name: Nodes.SymbolNoPrefix,
                    type: NodeType.Expression,
                    symbol: `__na(${ __text })`
                }));
                node.kind = nodeKind === AccessChainItemKind.NormalNullAsserted ?
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
    function emitCallExpression() {
        __text += "(";
        elementArgs = node.args!;
        length = elementArgs.length;
        for (index = 0; index < length; index++) {
            const node = elementArgs[index];
            __text += _emit(node, meta);
            if (index + 1 < length) {
                __text += commaAndWhitespace;
            }
        }
        __text += ")";
    }
    function simple_body_emit(_body: readonly INode[] = body as readonly INode[]) {
        __text += "{";
        _body.length && nl();
        ri();
        emit_body(_body);
        li();
        length && is();
        __text += "}";
    }
    body = node.body! as INode[] | AccessChainItem[];
    switch (node_name = node.name) {
        case Nodes.ArgumentsObject:
            __text += "arguments";
        case Nodes.Empty:
            break;
        case Nodes.IncludeStatment:
            assert_type<INode[]>(body);
            for (let index = 0, length = body.length; index < length; index++) {
                const element = body[index];
                __text += _emit(element, meta);
                if (__pretty && !isBlockNode(element) && element.type !== NodeType.Ephemerial) {
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
            assert_type<INode[]>(body);
            __text += "function";
            if (node_name === Nodes.GeneratorFunctionExpression) {
                __text += "*";
            }
            if (node.symbol) {
                __text += ` $${ node.symbol }`;
            } else sp();
            __text += "(";
            var pre_emitted = pre_emit_body();
            elementParams = node.params ??= [];
            length = elementParams.length;
            index = 0;
            var hasBody = body.length > 0;
            for (; index < length; index++) {
                const element = elementParams[index];
                var namae = element.name;
                if (!!element.default) hasBody = true;
                if (element.kind === ParameterNodeKind.Rest) {
                    hasBody = true;
                    break;
                }
                if (typeof namae === "string") {
                    __text += element.name = name = `${ element.kind === ParameterNodeKind.NoPrefix ? "" : "$" }${ namae || random_var_name() }`;
                } else {
                    throw "Destructing parameters are not supported yet";
                    //__text += _emit(name as unknown as Node, meta);
                }
                if (index + 1 < length && elementParams[index + 1].kind !== ParameterNodeKind.Rest) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            sp();
            __text += "{";
            ri();
            hasBody && nl();
            if (node.locals?.length) {
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
                        __text += node.name = name = `${ node.kind === ParameterNodeKind.NoPrefix ? "" : "$" }${ namae || random_var_name() }`;
                        if (node.default) {
                            var _tempVar = random_var_name();
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
                if (node.kind === ParameterNodeKind.Rest) {
                    hadRestParam = true;
                    is();
                    __text += `var ${ `$${ namae || random_var_name() }` }`;
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
                    __text += name ||= typeof node.name === "string" ? node.name : _emit(node.name, meta);
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
            __text += `$${ node.symbol }`;
            break;

        case Nodes.RegularExpression:
        case Nodes.ExternalVariable:
        case Nodes.SymbolNoPrefix:
        case Nodes.NumberValue:
            __text += node.symbol!;
            break;

        case Nodes.ThrowExpression:
            assert_type<[INode]>(body);
            __text += `__throw(${ _emit(body[0], meta) })`;
            break;

        case Nodes.StringValue: {
            const body = node.symbol!;
            __diff = occurrences(body, "'") >= occurrences(body, '"'), quote = __diff ? '"' : "'", rquote = __diff ? "'" : '"';
            __text += `${ quote }${ body.replace("\\" + rquote, rquote).replace("\n", "\\n") }${ quote }`;
            break;
        }

        case Nodes.PipelineExpression:
            assert_type<[INode, INode]>(body);
            name = random_var_name();
            __text += _emit({
                name: Nodes.CallExpression,
                type: NodeType.Expression,
                body: [{
                    name: node.outerBody?.name ?? Nodes.FunctionExpression, // async? generator? function node
                    type: NodeType.Expression,
                    params: [{
                        name,
                        kind: ParameterNodeKind.Normal
                    }],
                    body: [{
                        name: Nodes.ReturnStatment,
                        type: NodeType.Statment,
                        body: [body[0]]
                    }]
                }], args: [body[1]]
            }, meta);
            break;

        case Nodes.CallExpression:
            assert_type<INode[]>(body);
            __text += _emit(body[0], meta);
            emitCallExpression();
            break;

        case Nodes.GroupExpression:
            assert_type<INode[]>(body);
            __text += `(${ body.map(node => _emit(as_expression(node), meta)).join(commaAndWhitespace) })`;
            break;

        case Nodes.ReturnStatment:
            assert_type<[INode]>(body);
            __text += "return " + _emit(as_expression(body[0]), meta);
            break;

        case Nodes.RangeValue:
            assert_type<[INode, INode]>(body);
            __text += `(function*(){for(var i=${ _emit(body[0], meta) },e=${ _emit(body[1], meta) };i<e;i++)yield i})()`;
            break;

        case Nodes.ExponentiationAssignmentExpression:
            assert_type<[INode, INode]>(body);
            __text += _emit(body[0], meta);
            sp();
            __text += "=";
            sp();

        case Nodes.ExponentiationExpression:
            assert_type<[INode, INode]>(body);
            __text += `Math.pow(${ _emit(body[0], meta) },`;
            sp();
            __text += `${ _emit(body[1], meta) })`;
            break;

        case Nodes.AssignmentExpression:
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
            assert_type<[INode, INode]>(body);
            __text += _emit(body[0], meta);
            sp();
            __text += node.symbol;
            sp();
            __text += _emit(as_expression(body[1]), meta);
            break;

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
        case Nodes.LooseNegativeComparison:
        case Nodes.StrictNegativeComparison:
        case Nodes.LessThanOrEqual:
        case Nodes.GreaterThanOrEqual:
        case Nodes.LessThan:
        case Nodes.GreaterThan:
            assert_type<[INode, INode]>(body);
            __text += _emit(as_expression(body[0]), meta);
            sp();
            __text += node.symbol;
            sp();
            __text += _emit(as_expression(body[1]), meta);
            break;

        case Nodes.IfStatment:
            assert_type<INode[]>(body);
            __text += "if";
            sp();
            __text += "(";
            __text += _emit(as_expression(node.args![0]), meta);
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
                    bodyLength = (body = node.else!.body! as INode[]).length;
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
            assert_type<boolean>(_);
            assert_type<[INode]>(body);
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
            assert_type<boolean>(_);
            assert_type<[INode]>(body);
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
            assert_type<[INode]>(body);
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
            assert_type<AccessChainItem[]>(body);
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
            assert_type<INode[]>(body);
            __text += `[${ body.map(node => _emit(as_expression(node), meta)).join(commaAndWhitespace) }]`;
            break;

        case Nodes.ArgumentBindingExpression:
            assert_type<[INode]>(body);
            __text += `__bind(${ _emit(body[0], meta) },`;
            sp();
            __text += `u,`;
            sp();
            __text += `${ node.body!.map(node => _emit(as_expression(node as INode), meta)).join(commaAndWhitespace) })`;
            break;

        case Nodes.LiteralLogicalNotExpression:
            assert_type<[INode]>(body);
            _ = as_expression(body[0]);
            __text += `!${ isSimple(_) ? _emit(_, meta) : `(${ _emit(_, meta) })` }`;
            break;

        case Nodes.KeepStatment:
            assert_type<INode[]>(body);
            elementArgs = node.args!;
            bodyLength = body.length;
            var declared = elementArgs.map((arg, index) => {
                const name = declare(random_var_name());
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
            for (var index = 0; index < elementArgs.length; index++) {
                index && nl();
                is();
                __text += _emit(elementArgs[index], meta);
                sp();
                __text += "=";
                sp();
                __text += declared[index] + ";";
            }
            break;

        case Nodes.CodeBlock:
            simple_body_emit();
            break;

        case Nodes.NullAssertionExpression:
            assert_type<[INode]>(body);
            __text += `__na(${ _emit(as_expression(body[0]), meta) })`;
            break;

        case Nodes.NewExpression:
            assert_type<[INode]>(body);
            __text += "new " + _emit(as_expression(body[0]), meta);
            break;

        case Nodes.TryStatment:
            assert_type<ITryStatmentNode>(node);
            assert_type<INode[]>(body);
            __text += "try";
            sp();
            namae = node.else ? declare(random_var_name()) : "";
            simple_body_emit(namae ? [{
                name: Nodes.AssignmentExpression,
                type: NodeType.Expression,
                body: [
                    { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbol: namae },
                    { name: Nodes.TrueValue, type: NodeType.Expression }
                ],
                symbol: "="
            } as INode].concat(body || []) : undefined);
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
                        { name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbol: namae },
                        { name: Nodes.FalseValue, type: NodeType.Expression }
                    ],
                    symbol: "="
                } as INode].concat(node.catch[1]) : node.catch[1]);
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
                        args: [{ name: Nodes.SymbolNoPrefix, type: NodeType.Expression, symbol: namae }]
                    }],
                    finally: node.finally || []
                } as ITryStatmentNode | { else?: INode[], catch?: ITryStatmentNode["catch"]; } as INode] : node.finally);
            }
            break;

        case Nodes.SymbolShortcut:
            __text += `Symbol.${ node.symbol! }`;
            break;

        case Nodes.WhileStatment:
            __text += "while";
            sp();
            __text += `(${ _emit(as_expression(node.args![0]), meta) })`;
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
            __text += `(${ _emit(as_expression(node.args![0]), meta) })`;
            break;

        case Nodes.ImportExpression:
            __text += "import";
            emitCallExpression();
            break;

        case Nodes.ForRangeStatment:
            {
                const [from, to, as] = node.args as [INode, INode, string];
                __text += "for";
                sp();
                __text += "(var";
                sp();
                __text += as;
                sp();
                __text += "=";
                sp();
                __text += _emit(from, meta);
                if (isSimple(to)) {
                    __text += ";";
                    sp();
                    __text += as;
                    sp();
                    __text += "<";
                    sp();
                    __text += _emit(to, meta);
                } else {
                    __text += ",";
                    sp();
                    const _ = random_var_name();
                    __text += _;
                    sp();
                    __text += "=";
                    sp();
                    __text += _emit(to, meta) + ";";
                    sp();
                    __text += as;
                    sp();
                    __text += "<";
                    sp();
                    __text += _;
                }
                __text += ";";
                sp();
                __text += as + "++)";
                sp();
                simple_body_emit();
            }
            break;

        case undefined: {
            const sp = meta.indentation + "    ";
            __text += `/*\n${ sp }Cannot emit undefined, has something gone wrong?` +
                `\n${ sp }Stack trace:\n${ sp + Error().stack?.replace(/\n/g, `\n${ sp }`) }\n${ meta.indentation }*/`;
            break;
        }

        case Nodes.Shebang:
            __text += "#!" + node.symbol;
            break;

        case Nodes.ClassExpression:
            assert_type<IClassNode>(node);
            console.log(node);

        default:
            __text += `/*cannot emit node Nodes[${ node_name }]*/`;
            break;
    }
    return __text;
}
export interface IEmitterOptions {
    pretty?: boolean;
    forgetShebang?: boolean;
    url?: string;
}
var __top: INode;
class EmitterOptions implements IEmitterOptions {
    indentation: string = "";
    constructor(public readonly url: string | undefined) { }
}
/**
 * @param {import("./parser").Node} node 
 * @param {import("./emitter").EmitterOptions} opts
 */
export function emit(node: INode, { pretty = false, forgetShebang = true, ...other }: IEmitterOptions = {}) {
    __pretty = pretty;
    commaAndWhitespace = ',' + (__pretty ? " " : "");
    const options = new EmitterOptions(other.url);

    return (!forgetShebang && node.meta!.shebang && _emit(node.meta!.shebang as INode, options) || "") + _emit(__top = node, options);
}
