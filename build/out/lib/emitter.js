import { occurrences } from "./utils/occurrences.js";
import { assert, call, includes, randomVarName, undefined } from "./utils/util.js";
var __pretty = true;
var hasOwnProperty = {}.hasOwnProperty;
function assign(value, vals) {
    var result = new Object(value);
    for (var key in value) {
        if (call(hasOwnProperty, value, key)) {
            result[key] = vals[key];
        }
    }
    return result;
}
function as_expression(exp) {
    var _a, _b;
    if (exp.type === 1 /* Expression */) {
        return exp;
    }
    else {
        return {
            name: 41 /* CallExpression */,
            type: 1 /* Expression */,
            body: [{
                    name: (_b = (_a = exp.outerBody) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 0 /* FunctionExpression */,
                    type: 1 /* Expression */,
                    body: [exp]
                }],
            args: []
        };
    }
}
function isFunctionNode(node) {
    return includes([
        0 /* FunctionExpression */,
        2 /* AsyncFunctionExpression */,
        1 /* GeneratorFunctionExpression */,
        3 /* AsyncGeneratorFunctionExpression */,
        59 /* IncludeStatment */,
        81 /* KeepStatment */,
        82 /* CodeBlock */
    ], node.name);
}
function isSimple(node) {
    return includes([
        77 /* Array */,
        79 /* ArgumentBindingExpression */,
        2 /* AsyncFunctionExpression */,
        3 /* AsyncGeneratorFunctionExpression */,
        52 /* BigIntValue */,
        41 /* CallExpression */,
        43 /* MemberAccessExpression */,
        46 /* FalseValue */,
        45 /* TrueValue */,
        50 /* InfinityValue */,
        49 /* NaNValue */,
        47 /* NullValue */,
        51 /* NumberValue */,
        60 /* RangeValue */,
        53 /* StringValue */,
        54 /* Symbol */,
        75 /* SymbolNoPrefix */,
        48 /* UndefinedValue */,
        80 /* ArgumentsObject */
    ], node.name);
}
/**
 * @param {import("./parser").Node} node
 * @param {any} [meta]
 */
export function _emit(node, meta) {
    var _a, _b, _c, _d;
    var __text = "", elementParams, elementArgs, length, index, body, __diff, quote, rquote, name, node_name, _;
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
    function declare(name) {
        (__top.params || (__top.params = [])).push({
            name: name,
            type: 3 /* NoPrefix */
        });
    }
    function pre_emit_body() {
        var _a;
        var saved = __text, is_async = node_name === 2 /* AsyncFunctionExpression */ ||
            node_name === 3 /* AsyncGeneratorFunctionExpression */;
        __text = "";
        ri();
        is_async && ri();
        emit_body();
        is_async && li();
        li();
        (_a = [saved, __text], __text = _a[0], saved = _a[1]);
        return saved;
    }
    function emit_body() {
        assert(body);
        index = 0, length = body.length;
        for (var assigned = 0; index < length; index++) {
            if (body[index].name !== 76 /* Empty */) {
                assigned++;
                is();
                __text += _emit(body[index], meta);
                if ((index + 1 < length || __pretty) && !isFunctionNode(body[index])) {
                    __text += ";";
                }
                nl();
            }
        }
        if (!assigned) {
            sp();
        }
    }
    function emitChain(nodes) {
        function sp() {
            __pretty && (___text += " ");
        }
        for (var index = 0, length = nodes.length, __text = ""; index < length; index++) {
            var node = nodes[index], body = node.body, nodeKind = node.kind;
            if (nodeKind === 0 /* Head */) {
                __text += _emit(body, meta);
            }
            else if (nodeKind === 1 /* Normal */) {
                __text += "." + _emit(body, meta);
            }
            else if (nodeKind === 2 /* Computed */) {
                __text += "[" + _emit(body, meta) + "]";
            }
            else if (nodeKind === 3 /* Optional */ || nodeKind === 4 /* OptionalComputed */) {
                var randomName = randomVarName(), ___text = "(n(" + randomName;
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
                    kind: 0 /* Head */,
                    body: {
                        name: 75 /* SymbolNoPrefix */,
                        type: 1 /* Expression */,
                        symbolName: randomName
                    }
                });
                nodes[1].kind = nodeKind === 3 /* Optional */ ?
                    1 /* Normal */ :
                    2 /* Computed */;
                return "" + ___text + emitChain(nodes) + ")";
            }
            else {
                nodes.splice(0, index, {
                    kind: 0 /* Head */,
                    body: {
                        name: 75 /* SymbolNoPrefix */,
                        type: 1 /* Expression */,
                        symbolName: "__na(" + __text + ")"
                    }
                });
                nodes[1].kind = nodeKind === 5 /* NormalNullAsserted */ ?
                    1 /* Normal */ :
                    2 /* Computed */;
                return emitChain(nodes);
            }
        }
        return __text;
    }
    meta !== null && meta !== void 0 ? meta : (meta = {});
    (_a = meta.sp) !== null && _a !== void 0 ? _a : (meta.sp = "");
    body = node.body;
    switch (node_name = node.name) {
        case 80 /* ArgumentsObject */:
            __text += "arguments";
        case 76 /* Empty */:
            break;
        case 59 /* IncludeStatment */:
            assert(body);
            for (var index_1 = 0, length_1 = body.length; index_1 < length_1; index_1++) {
                var element = body[index_1];
                __text += _emit(element, meta);
                if (__pretty && !isFunctionNode(body[index_1])) {
                    __text += ";";
                }
                if (index_1 < length_1 - 1) {
                    nl();
                    is();
                }
            }
            break;
        case 3 /* AsyncGeneratorFunctionExpression */:
        case 1 /* GeneratorFunctionExpression */:
        case 2 /* AsyncFunctionExpression */:
        case 0 /* FunctionExpression */:
            assert(body);
            __text += "function";
            if (node_name === 1 /* GeneratorFunctionExpression */) {
                __text += "*";
            }
            if (node.symbolName) {
                __text += " $" + node.symbolName;
            }
            else
                sp();
            __text += "(";
            var pre_emitted = pre_emit_body();
            elementParams = node.params || (node.params = []);
            length = elementParams.length;
            index = 0;
            var hasBody = body.length > 0 || elementParams.some(function (element) { return !!element["default"] || element.type === 1 /* Rest */; });
            for (; index < length; index++) {
                var node_1 = elementParams[index], namae = node_1.name;
                if (typeof namae === "string") {
                    __text += node_1.name = name = "" + (node_1.type === 3 /* NoPrefix */ ? "" : "$") + (namae || randomVarName());
                }
                else {
                    throw "Destructing parameters are not supported yet";
                    //__text += _emit(name as unknown as Node, meta);
                }
                if (index + 1 < length) {
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
                __text += "var " + node.locals.map(function (local) { return "$" + local; }).join("," + (__pretty ? " " : "")) + ";";
                nl();
            }
            if (node_name === 2 /* AsyncFunctionExpression */ || node_name === 3 /* AsyncGeneratorFunctionExpression */) {
                !hasBody && nl();
                is();
                ri();
                __text += "return __async" + (node_name === 3 /* AsyncGeneratorFunctionExpression */ ? '_gen' : '') + "(function*";
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
                var node_2 = elementParams[index];
                if (node_2.type === 1 /* Rest */) {
                    hadRestParam = true;
                    is();
                    name = typeof node_2.name === "string" ? node_2.name : _emit(node_2.name, meta);
                    __text += "var " + name;
                    sp();
                    __text += "=";
                    sp();
                    __text += "__call([].slice,";
                    sp();
                    __text += "arguments";
                    if (index || length !== 1) {
                        __text += ",";
                        sp();
                        __text += index;
                        if (index + 1 < length) {
                            __text += ",";
                            sp();
                            __text += -(length - index - 1);
                        }
                    }
                    __text += ");";
                    nl();
                }
                if (node_2["default"]) {
                    is();
                    name || (name = typeof node_2.name === "string" ? node_2.name : _emit(node_2.name, meta));
                    __text += name;
                    sp();
                    __text += "===";
                    sp();
                    __text += "u";
                    sp();
                    __text += "&&";
                    sp();
                    __text += "(" + name;
                    sp();
                    __text += "=";
                    sp();
                    __text += _emit(as_expression(node_2["default"]), meta) + ");";
                    nl();
                }
            }
            __text += pre_emitted;
            li();
            if (node_name === 2 /* AsyncFunctionExpression */ || node_name === 3 /* AsyncGeneratorFunctionExpression */) {
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
        case 46 /* FalseValue */:
            __text += __pretty ? "false" : "!1";
            break;
        case 45 /* TrueValue */:
            __text += __pretty ? "true" : "!0";
            break;
        case 48 /* UndefinedValue */:
            __text += "u";
            break;
        case 47 /* NullValue */:
            __text += "null";
            break;
        case 49 /* NaNValue */:
            __text += "0/0";
            break;
        case 50 /* InfinityValue */:
            __text += __pretty ? "Infinity" : "1/0";
            break;
        case 54 /* Symbol */:
            __text += "$" + node.symbolName;
            break;
        case 75 /* SymbolNoPrefix */:
            __text += node.symbolName;
            break;
        case 51 /* NumberValue */:
            assert(body);
            __text += body;
            break;
        case 5 /* ThrowExpression */:
            assert(body);
            __text += "__throw(" + _emit(body[0], meta) + ")";
            break;
        case 53 /* StringValue */:
            assert(body);
            __diff = occurrences(body, "'") >= occurrences(body, '"'), quote = __diff ? '"' : "'", rquote = __diff ? "'" : '"';
            __text += "" + quote + body.replace("\\" + rquote, rquote).replace("\n", "\\n") + quote;
            break;
        case 55 /* PipelineExpression */:
            assert(body);
            name = randomVarName();
            __text += _emit({
                name: 41 /* CallExpression */,
                type: 1 /* Expression */,
                body: [{
                        name: (_c = (_b = node.outerBody) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 0 /* FunctionExpression */,
                        type: 1 /* Expression */,
                        params: [{
                                name: name,
                                type: 0 /* Normal */
                            }],
                        body: [{
                                name: 64 /* ReturnStatment */,
                                type: 0 /* Statment */,
                                body: [body[0]]
                            }]
                    }],
                args: [body[1]]
            }, __pretty);
            break;
        case 41 /* CallExpression */:
            assert(body);
            __text += _emit(body[0], meta);
            __text += "(";
            elementArgs = node.args;
            length = elementArgs.length;
            index = 0;
            for (; index < length; index++) {
                var node_3 = elementArgs[index];
                __text += _emit(node_3, meta);
                if (index + 1 < length) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            break;
        case 6 /* GroupExpression */:
            assert(body);
            __text += "(";
            length = body.length;
            index = 0;
            for (; index < length; index++) {
                var node_4 = body[index];
                __text += _emit(node_4, meta);
                if (index + 1 < length) {
                    __text += ",";
                    sp();
                }
            }
            __text += ")";
            break;
        case 64 /* ReturnStatment */:
            assert(body);
            __text += "return " + _emit(as_expression(body[0]), meta);
            break;
        case 60 /* RangeValue */:
            assert(body);
            var s = +body[0].body, e = +body[1].body;
            __text += s === e ? "(function*(){})()" :
                "(function*(){for(var i=" + s + ",e=" + e + ";i" + (s > e ? ">" : "<") + "e;i" + (s > e ? "--" : "++") + ")yield i})()";
            break;
        case 73 /* ExternalVariable */:
            assert(body);
            __text += body;
            break;
        case 13 /* ExponentiationAssignmentExpression */:
            assert(body);
            __text += _emit(body[0], meta);
            sp();
            __text += "=";
            sp();
        case 29 /* ExponentiationExpression */:
            assert(body);
            __text += "Math.pow(" + _emit(body[0], meta) + ",";
            sp();
            __text += _emit(body[1], meta) + ")";
            break;
        case 7 /* AssignmentExpression */:
            assert(body);
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
        case 8 /* AddictionAssignmentExpression */:
        case 9 /* SubstractionAssignmentExpression */:
        case 10 /* MultiplicationAssignmentExpression */:
        case 11 /* DivisionAssignmentExpression */:
        case 12 /* RemainderAssignmentExpression */:
        case 14 /* BitwiseANDAssignmentExpression */:
        case 15 /* BitwiseXORAssignmentExpression */:
        case 16 /* BitwiseORAssignmentExpression */:
        case 17 /* LogicalNullishCoalescingAssignmentExpression */:
        case 18 /* LogicalANDAssignmentExpression */:
        case 19 /* LogicalORAssignmentExpression */:
        case 20 /* DestructingAssignmentExpression */:
        case 21 /* BitwiseLeftShiftAssignmentExpression */:
        case 22 /* BitwiseRightShiftAssignmentExpression */:
        case 23 /* BitwiseUnsignedRightShiftAssignmentExpression */:
        case 24 /* AddictionExpression */:
        case 25 /* SubstractionExpression */:
        case 26 /* MultiplicationExpression */:
        case 27 /* DivisionExpression */:
        case 28 /* RemainderExpression */:
        case 30 /* BitwiseANDExpression */:
        case 31 /* BitwiseNOTExpresssion */:
        case 32 /* BitwiseXORExpression */:
        case 33 /* BitwiseORExpression */:
        case 34 /* NullishCoalescingExpression */:
        case 35 /* LogicalANDExpression */:
        case 36 /* LogicalNOTExpresssion */:
        case 37 /* LogicalORExpression */:
        case 38 /* BitwiseLeftShiftExpression */:
        case 39 /* BitwiseRightShiftExpression */:
        case 40 /* BitwiseUnsignedRightShiftExpression */:
        case 65 /* LooseComparison */:
        case 66 /* StrictComparison */:
        case 67 /* LessThanOrEqual */:
        case 68 /* GreaterThanOrEqual */:
        case 69 /* LessThan */:
        case 70 /* GreaterThan */:
            assert(body);
            __text += _emit(body[0], meta);
            sp();
            __text += node.symbolName;
            sp();
            __text += _emit(as_expression(body[1]), meta);
            break;
        case 44 /* IfStatment */:
            assert(body);
            __text += "if";
            sp();
            __text += "(";
            __text += _emit(as_expression(node.args), meta);
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
            if (node["else"] || node.elseif) {
                sp();
                __text += "else";
                if (node.elseif) {
                    __text += " " + _emit(node.elseif, meta);
                }
                else {
                    sp();
                    __text += "{";
                    bodyLength = (body = node["else"].body).length;
                    bodyLength && nl();
                    ri();
                    emit_body();
                    li();
                    bodyLength && is();
                    __text += "}";
                }
            }
            break;
        case 71 /* YieldExpression */:
            assert(_);
            assert(body);
            __text += "yield";
            if (_ = node.outerBody.name === 3 /* AsyncGeneratorFunctionExpression */) {
                sp();
                __text += "[1,";
                sp();
            }
            else {
                __text += " ";
            }
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
            break;
        case 72 /* YieldFromExpression */:
            assert(_);
            assert(body);
            __text += "yield*";
            if (_ = node.outerBody.name === 3 /* AsyncGeneratorFunctionExpression */) {
                sp();
                __text += "[2,";
            }
            sp();
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
        case 74 /* AwaitExpression */:
            assert(_);
            assert(body);
            __text += "yield";
            if (_ = node.outerBody.name === 3 /* AsyncGeneratorFunctionExpression */) {
                sp();
                __text += "[0,";
                sp();
            }
            else {
                __text += " ";
            }
            __text += _emit(as_expression(body[0]), meta);
            if (_) {
                __text += "]";
            }
            break;
        case 43 /* MemberAccessExpression */:
            assert(body);
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
        case 77 /* Array */:
            assert(body);
            __text += "[" + body.map(function (node) { return _emit(as_expression(node), meta); }).join("," + (__pretty ? " " : "")) + "]";
            break;
        case 79 /* ArgumentBindingExpression */:
            assert(body);
            __text += "__bind(" + _emit(body[0], meta) + ",";
            sp();
            __text += "u,";
            sp();
            __text += node.args.map(function (node) { return _emit(as_expression(node), meta); }).join("," + (__pretty ? " " : "")) + ")";
            break;
        case 57 /* LiteralLogicalNotExpression */:
            assert(body);
            assert(_);
            _ = _emit(body[0], meta);
            __text += "!" + (isSimple(body[0]) ? _ : "(" + as_expression(_) + ")");
            break;
        case 81 /* KeepStatment */:
            assert(body);
            elementArgs = node.args;
            bodyLength = body.length;
            var declared = elementArgs.map(function (arg, index) {
                var name = randomVarName();
                declare(name);
                index && is();
                __text += name;
                sp();
                __text += "=";
                sp();
                __text += _emit(arg, meta) + ";";
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
        case 82 /* CodeBlock */:
            __text += "{";
            body.length && nl();
            ri();
            emit_body();
            li();
            body.length && is();
            __text += "}";
            nl();
            break;
        case 85 /* NullAssertionExpression */:
            assert(body);
            __text += "__na(" + _emit(as_expression(body[0]), meta) + ")";
            break;
        case 83 /* NewExpression */:
            assert(body);
            __text += "new " + _emit(as_expression(body[0]), meta);
            break;
        case undefined: {
            var sp_1 = meta.sp + "    ";
            __text += "/*\n" + sp_1 + "Cannot emit undefined, has something gone wrong?" +
                ("\n" + sp_1 + "Stack trace:\n" + (sp_1 + ((_d = Error().stack) === null || _d === void 0 ? void 0 : _d.replace(/\n/g, "\n" + sp_1))) + "\n" + meta.sp + "*/");
            break;
        }
        case 84 /* ClassExpression */:
            assert(node);
            console.log(node);
        default:
            __text += "/*cannot emit node Nodes[" + node_name + "]*/";
            break;
    }
    assert(__text.toString());
    return __text;
}
var __top;
/**
 * @param {import("./parser").Node} node
 * @param {import("./emitter").EmitterOptions} opts
 */
export function emit(node, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.pretty, pretty = _c === void 0 ? false : _c, _d = _b.url, url = _d === void 0 ? "" : _d;
    __pretty = pretty;
    // console.log(inspect(node, !0, 1 / 0, !0));
    return _emit(__top = node, { url: url });
}
