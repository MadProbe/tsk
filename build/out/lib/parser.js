// @ts-check
/** @author MadProbe#7435 */
import { Stream } from "./utils/stream.js";
import { nullish, assert, isArray, include, resetCounter, undefined, _echo, SyntaxError, randomVarName, includes } from "./utils/util.js";
import { lex } from "./lexer.js";
import { CommonOperatorTable, AssignmentOperatorTable } from "./utils/table.js";
import { Diagnostic } from "./utils/diagnostics.js";
function parseMemberAccess(sym, next, stream, meta) {
    var chain = [{
            kind: 0 /* Head */,
            body: sym
        }];
    while (next[0] === 3 /* Operator */ && includes([".", "?.", "!.", "![", "?.[", "["], next[1])) {
        if (next[1] === ".") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== 2 /* Symbol */ && next[0] !== 8 /* Keyword */) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: 1 /* Normal */,
                body: { name: 75 /* SymbolNoPrefix */, type: 1 /* Expression */, symbolName: next[1] }
            });
        }
        else if (next[1] === "[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            }
            else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== 3 /* Operator */ || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: 2 /* Computed */,
                body: parsed
            });
        }
        else if (next[1] === "?.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== 2 /* Symbol */ && next[0] !== 8 /* Keyword */) {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: 3 /* Optional */,
                body: { name: 75 /* SymbolNoPrefix */, type: 1 /* Expression */, symbolName: next[1] }
            });
        }
        else if (next[1] === "?.[") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            }
            else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== 3 /* Operator */ || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            chain.push({
                kind: 4 /* OptionalComputed */,
                body: parsed
            });
        }
        else if (next[1] === "!.") {
            next = next_and_skip_shit_or_fail(stream, "symbol");
            if (next[0] !== 2 /* Symbol */ && next[0] !== 8 /* Keyword */) {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: 5 /* NormalNullAsserted */,
                body: { name: 75 /* SymbolNoPrefix */, type: 1 /* Expression */, symbolName: next[1] }
            });
        }
        else if (next[1] === "![") {
            var parsed = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
            if (isArray(parsed)) {
                next = stream.next;
                parsed = parsed[0];
            }
            else {
                next = next_and_skip_shit_or_fail(stream, "]");
            }
            if (next[0] !== 3 /* Operator */ || next[1] !== "]") {
                error_unexcepted_token(next);
            }
            __used.na = true;
            chain.push({
                kind: 6 /* ComputedNullAsserted */,
                body: parsed
            });
        }
        else {
            break;
        }
        next = next_and_skip_shit_or_fail(stream, "any");
    }
    downgrade_next(stream);
    return _parse({
        name: 43 /* MemberAccessExpression */,
        type: 1 /* Expression */,
        body: chain
    }, stream, meta);
}
function isNode(value) {
    return !isArray(value) && typeof value === "object" && !nullish(value);
}
function downgrade_next(stream) {
    while (~[6 /* Whitespace */, 10 /* MultilineComment */, 7 /* Comment */].indexOf(stream.down()[0]))
        ;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function next_or_fail(stream, end, prefix) {
    stream.move();
    var next = stream.next, newlines;
    if (!next) {
        throw ((prefix || "") + " Unexcepted EOF - '" + end + "' excepted").trim();
    }
    // __line += newlines = occurrences(next[1], '\n');
    // if (newlines !== 0) {
    //     __column = 0;
    // }
    // __column += next[1].length - next[1].lastIndexOf("\n");
    return next;
}
/**
 * @param {import("./utils/stream.js").Token} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function skip_whitespace(next, stream, end, prefix) {
    return next[0] === 6 /* Whitespace */ ? next_or_fail(stream, end, prefix) : next;
}
/**
 * shit == whitespace and comments
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} end
 * @param {string} [prefix]
 */
function next_and_skip_shit_or_fail(stream, end, prefix) {
    var _temp;
    while ((_temp = skip_whitespace(next_or_fail(stream, end, prefix), stream, end, prefix))[0] === 10 /* MultilineComment */ || _temp[0] === 7 /* Comment */) {
        var _exec = /\s*internal\:\s*(.+)/.exec(_temp[1]);
        if (_exec) {
            Function(_exec[1])();
        }
    }
    ;
    return _temp;
}
var keywordsHandlers = {
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    nonlocal: function (stream, meta) {
        if (!meta.outer.nonlocals) {
            throw "Nonlocal statment: this statment cannot be used in top-level scope!";
        }
        var next = next_and_skip_shit_or_fail(stream, "symbol");
        if (next[0] !== 2 /* Symbol */) {
            error_unexcepted_token(next);
        }
        meta.outer.nonlocals.push(next[1]);
        meta.outer.locals = meta.outer.locals.filter(function (sym) { return sym !== next[1]; });
        return {
            name: 76 /* Empty */,
            type: 1 /* Expression */
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    include: function (stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "string");
        if (next[0] !== 0 /* String */) {
            error_unexcepted_token(next);
        }
        var _next = next_and_skip_shit_or_fail(stream, ";");
        if (_next[0] !== 4 /* Special */ || _next[1] !== ";") {
            throw "Include statment must be follewed by a semicolon!";
        }
        var file = new URL(next[1], meta.filename);
        var included = include(file, __cache);
        /**
         * @param {string} included
         */
        function _(included) {
            var parsed = main_parse(Stream(lex(included)), file.href, meta.outer);
            node.body = parsed;
            return parsed;
        }
        var node = {
            name: 59 /* IncludeStatment */,
            type: 1 /* Expression */
        };
        node.body = (typeof included !== "string" ? promises[promises.push(included.then(_)) - 1] : _(included));
        return node;
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    "if": function (stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "(");
        if (next[0] !== 4 /* Special */ || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        var expression = _parse(next = next_and_skip_shit_or_fail(stream, end_expression), stream, meta), expressions;
        // console.log(expression);
        if (!isArray(expression)) {
            next = next_and_skip_shit_or_fail(stream, ")");
            expression = [expression];
        }
        else
            next = stream.next;
        if (next[0] !== 4 /* Special */ || next[1] !== ")") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "{");
        if (next[0] === 4 /* Special */ && next[1] === "{") {
            expressions = parse_body(stream, meta);
        }
        else {
            expressions = [_parse(next, stream, meta)];
        }
        var node = {
            name: 44 /* IfStatment */,
            type: 0 /* Statment */,
            body: expressions,
            args: expression[0],
            "else": undefined,
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
        };
        try {
            next = next_and_skip_shit_or_fail(stream, "else");
        }
        catch (error) {
            return node;
        }
        if (next[0] === 8 /* Keyword */ && next[1] === "else") {
            next = next_and_skip_shit_or_fail(stream, "if");
            if (next[0] === 8 /* Keyword */ && next[1] === "if") {
                var parsed = keywordsHandlers["if"](stream, meta);
                if (isArray(parsed)) {
                    node.elseif = parsed[0];
                    return [node];
                }
                else {
                    node.elseif = parsed;
                    return node;
                }
            }
            else if (next[0] === 4 /* Special */ && next[1] === "{") {
                node["else"] = {
                    name: 78 /* ElseStatment */,
                    type: 0 /* Statment */,
                    body: parse_body(stream, meta)
                };
                return node;
            }
            else {
                error_unexcepted_token(next);
            }
        }
        else {
            return [node];
        }
    },
    "true": function () {
        return {
            name: 45 /* TrueValue */,
            type: 1 /* Expression */
        };
    },
    "false": function () {
        return {
            name: 46 /* FalseValue */,
            type: 1 /* Expression */
        };
    },
    undefined: function () {
        return {
            name: 48 /* UndefinedValue */,
            type: 1 /* Expression */
        };
    },
    "null": function () {
        return {
            name: 47 /* NullValue */,
            type: 1 /* Expression */
        };
    },
    NaN: function () {
        return {
            name: 49 /* NaNValue */,
            type: 1 /* Expression */
        };
    },
    Infinity: function () {
        return {
            name: 50 /* InfinityValue */,
            type: 1 /* Expression */
        };
    },
    arguments: function () {
        return {
            name: 80 /* ArgumentsObject */,
            type: 1 /* Expression */
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    interface: function (stream) {
        var prefix = _echo("Interface statment:");
        var next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        if (next[0] !== 2 /* Symbol */) {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "{", prefix);
        if (next[0] !== 4 /* Special */ || next[1] !== "{") {
            error_unexcepted_token(next);
        }
        error_unexcepted_token([8 /* Keyword */, "interface"]);
    },
    "import": function (stream) {
        error_unexcepted_token(stream.next);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    async: function (stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, "fn", "Async(Generator?)Function statment:");
        if (next[0] !== 8 /* Keyword */ || next[1] !== "fn") {
            error_unexcepted_token(next);
        }
        return keywordsHandlers.fn(stream, { filename: meta.filename, outer: null }, 2 /* Async */);
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    not: function (stream, meta) {
        return abruptify({
            name: 57 /* LiteralLogicalNotExpression */,
            type: 1 /* Expression */
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta));
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external_var: function (stream) {
        var prefix = "External variable " + end_expression + ":";
        var next = next_and_skip_shit_or_fail(stream, "(", prefix);
        if (next[0] !== 4 /* Special */ || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "string", prefix);
        if (next[0] !== 0 /* String */) {
            error_unexcepted_token(next);
        }
        var name = next[1];
        next = next_and_skip_shit_or_fail(stream, ")", prefix);
        if (next[0] !== 4 /* Special */ || next[1] !== ")") {
            error_unexcepted_token(next);
        }
        return {
            name: 73 /* ExternalVariable */,
            type: 1 /* Expression */,
            body: name
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     */
    __external: function (stream) {
        var prefix = _echo("External statment:");
        var next = next_and_skip_shit_or_fail(stream, "(", prefix);
        if (next[0] !== 4 /* Special */ || next[1] !== "(") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "string", prefix);
        if (next[0] !== 0 /* String */) {
            error_unexcepted_token(next);
        }
        var name = next[1];
        next = next_and_skip_shit_or_fail(stream, ")", prefix);
        if (next[0] !== 4 /* Special */ || next[1] !== ")") {
            error_unexcepted_token(next);
        }
        return {
            name: 73 /* ExternalVariable */,
            type: 0 /* Statment */,
            body: name
        };
    },
    /**
     * @param {import("./utils/stream.js").TokenStream} stream
     * @param {import("./parser").ParseMeta} meta
     */
    fn: function (stream, meta, type) {
        if (type === void 0) { type = 0 /* Sync */; }
        var _prefix = _echo("Function statment:");
        var _ = [
            _prefix,
            "Generator" + _prefix,
            "Async" + _prefix
        ];
        _[3] = "Async" + _[1];
        var prefix = _[type];
        var name = "";
        var params = [];
        var next = next_and_skip_shit_or_fail(stream, 'symbol" | "(', prefix);
        var paramType;
        var hasRest = false;
        var index;
        if (next[0] === 3 /* Operator */ && next[1] === "*") {
            if (type === 0 /* Sync */) {
                type = 1 /* Generator */;
            }
            else if (type === 2 /* Async */) {
                type = 3 /* AsyncGenerator */;
            }
            next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        }
        else if (type === 1 /* Generator */ || type === 3 /* AsyncGenerator */) {
            throw prefix + " Unexcepted token '" + next[1] + "' ('*' excepted)";
        }
        if (next[0] === 2 /* Symbol */) {
            name = next[1];
            next = next_and_skip_shit_or_fail(stream, "(", prefix);
        }
        if (next[0] !== 4 /* Special */ && next[1] !== "(") {
            error_unexcepted_token(next);
        }
        var node = {
            name: type,
            type: 1 /* Expression */,
            params: params,
            symbolName: name,
            locals: [],
            nonlocals: []
        };
        var innerMeta = { outer: node, filename: meta.filename };
        for (;;) {
            paramType = 0 /* Normal */;
            next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
            if (next[0] === 4 /* Special */ && next[1] === ",") {
                params.push({
                    name: "",
                    type: 2 /* Empty */
                });
                continue;
            }
            if (next[0] === 3 /* Operator */ && next[1] === "...") {
                if (hasRest) {
                    throw SyntaxError("Cannot append second rest parameter to " + (name ? "function " + name : "anonymous function"));
                }
                hasRest = true;
                paramType = 1 /* Rest */;
                next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
            }
            if (next[0] === 2 /* Symbol */) {
                var paramNode = {
                    name: next[1],
                    type: paramType
                };
                params.push(paramNode);
                next = next_and_skip_shit_or_fail(stream, ",", prefix);
                if (next[0] === 3 /* Operator */ && next[1] === "=") {
                    var parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, innerMeta);
                    if (isArray(parsed)) {
                        parsed = parsed[0];
                        next = stream.next;
                    }
                    else {
                        next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
                    }
                    paramNode["default"] = parsed;
                }
                if (next[0] === 4 /* Special */ && next[1] === ")") {
                    break;
                }
                else if (next[0] !== 4 /* Special */ && next[1] !== ",") {
                    error_unexcepted_token(next);
                }
            }
            else if (next[0] === 4 /* Special */ && next[1] === ",") {
                params.push({
                    name: "",
                    type: paramType || 2 /* Empty */
                });
            }
            else if (next[0] === 4 /* Special */ && next[1] === ")") {
                break;
            }
            else {
                error_unexcepted_token(next);
            }
        }
        index = params.length;
        for (; index && params[--index].type === 2 /* Empty */;)
            params.pop();
        // apply(console.log, console, params); // IE 8 is very old and strange shit
        next = next_and_skip_shit_or_fail(stream, "{", prefix);
        if (next[0] === 3 /* Operator */ && next[1] === "=>") {
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
            if (next[0] !== 4 /* Special */ && next[1] !== "{") {
                return abruptify(node, abruptify({
                    name: 64 /* ReturnStatment */,
                    type: 0 /* Statment */
                }, _parse(next, stream, innerMeta)));
            }
        }
        if (next[0] !== 4 /* Special */ && next[1] !== "{") {
            error_unexcepted_token(next);
        }
        node.body = parse_body(stream, innerMeta);
        return node;
    },
    "class": function (stream, meta) {
        var type = meta.insideExpression ? 1 /* Expression */ : 0 /* Statment */;
        var node = {
            name: 84 /* ClassExpression */,
            type: type,
            getters: [],
            settets: [],
            props: [],
            methods: [],
            privateGetters: [],
            privateSettets: [],
            privateMethods: [],
            privateProps: [],
            mixins: []
        };
        var prefix = _echo("Class expression:");
        var next = next_and_skip_shit_or_fail(stream, ["{", "symbol", "extends"].join('" | "'), prefix);
        if (next[0] === 2 /* Symbol */) {
            node.symbolName = next[1];
            next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        }
        if (next[0] === 8 /* Keyword */ && next[1] === "extends") {
            var extender = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
            if (isArray(extender)) {
                node["extends"] = extender[0];
                next = stream.next;
            }
            else {
                node["extends"] = extender;
                next = next_and_skip_shit_or_fail(stream, "any", prefix);
            }
            if (next[0] === 8 /* Keyword */ && next[1] === "with") {
                while (next[0] !== 4 /* Special */ || next[1] !== "{") {
                    var parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
                    if (isArray(parsed)) {
                        parsed = parsed[0];
                        next = stream.next;
                    }
                    else {
                        next = next_and_skip_shit_or_fail(stream, "any", prefix);
                    }
                    if (next[0] !== 4 /* Special */ || (next[1] !== "," && next[1] !== "{")) {
                        error_unexcepted_token(next);
                    }
                    node.mixins.push(parsed);
                }
            }
        }
        if (!type && !node.symbolName) {
            diagnostics.push(Diagnostic(1 /* Warn */, "Class statment doesn't have a name - a random name will be given during compilation"));
            node.symbolName = randomVarName();
        }
        if (next[0] === 4 /* Special */ && next[1] === "{") {
            while ((next = next_and_skip_shit_or_fail(stream, ["keyword", "symbol", "string"].join('" | "'), prefix))[1] !== "}" &&
                next[0] !== 4 /* Special */) {
                if ([2 /* Symbol */, 0 /* String */, 8 /* Keyword */].indexOf(next[0])) {
                    var next2 = next_and_skip_shit_or_fail(stream, ["=", "symbol", "("].join('" | "'), prefix);
                    if (next[0] === 8 /* Keyword */)
                        if (next2[0] === 2 /* Symbol */ && includes(["get", "set", "async"], next[1])) {
                        }
                }
            }
            // next = next_and_skip_shit_or_fail(stream, "}", prefix);
            // if (next[0] !== Tokens.Special || next[1] !== "}") {
            //     error_unexcepted_token(next);
            // }
        }
        else
            error_unexcepted_token(next);
        return node;
    },
    "return": function (stream, meta) {
        return abruptify({
            name: 64 /* ReturnStatment */,
            type: 0 /* Statment */
        }, _parse(next_and_skip_shit_or_fail(stream, end_expression, "Return statment:"), stream, meta));
    },
    yield: function (stream, meta) {
        var next = next_and_skip_shit_or_fail(stream, end_expression, "Yield expression:");
        var yield_from = next[0] === 3 /* Operator */ && next[1] === "*";
        var expression = yield_from ?
            parse_expression(stream, meta) :
            _parse(next, stream, meta);
        return abruptify({
            name: yield_from ? 72 /* YieldFromExpression */ : 71 /* YieldExpression */,
            type: 1 /* Expression */,
            outerBody: meta.outer
        }, expression);
    },
    await: function (stream, meta) {
        if (meta.outer.name === 0 /* FunctionExpression */) {
            diagnostics.push(Diagnostic(2 /* RuntimeError */, "Using await inside Sync Function Expression will fail at runtime"));
        }
        if (meta.outer.name === 1 /* GeneratorFunctionExpression */) {
            diagnostics.push(Diagnostic(1 /* Warn */, "Await is not intended to be used inside Generator Functions"));
        }
        var prefix = _echo("Await expression:");
        var next = next_and_skip_shit_or_fail(stream, end_expression, prefix);
        if (next[0] === 3 /* Operator */ && next[1] === ".") {
            next = next_and_skip_shit_or_fail(stream, ['any', 'all', 'allSettled', 'race'].join('" | "'), prefix);
            if (next[0] === 2 /* Symbol */ && /^(any|all(Settled)?|race)$/m.test(next[1])) {
                var expression = _parse(next_and_skip_shit_or_fail(stream, end_expression, prefix), stream, meta);
                var _ = {
                    name: 41 /* CallExpression */,
                    type: 1 /* Expression */,
                    body: [{
                            name: 75 /* SymbolNoPrefix */,
                            type: 1 /* Expression */,
                            symbolName: "p." + next[1]
                        }],
                    args: [expression]
                };
                if (isArray(expression)) {
                    _.args[0] = expression[0];
                    expression = [_];
                }
                else
                    expression = _;
            }
            else {
                error_unexcepted_token(next);
            }
        }
        else {
            expression = _parse(next, stream, meta);
        }
        return abruptify({
            name: 74 /* AwaitExpression */,
            type: 1 /* Expression */,
            outerBody: meta.outer
        }, expression);
    },
    "this": function () {
        return {
            name: 75 /* SymbolNoPrefix */,
            type: 1 /* Expression */,
            symbolName: "this"
        };
    },
    keep: function (stream, meta) {
        var prefix = _echo("Keep statment:");
        var next = next_and_skip_shit_or_fail(stream, "(", prefix);
        var args = [];
        if (next[0] !== 4 /* Special */ && next[1] !== "(") {
            error_unexcepted_token(next);
        }
        next = next_and_skip_shit_or_fail(stream, "symbol", prefix);
        if (next[0] === 4 /* Special */ || next[1] !== ")") {
            while (1) {
                if (next[0] === 4 /* Special */ && next[1] === ")") {
                    break;
                }
                if (next[0] === 4 /* Special */ && next[1] === ",") {
                    next = next_and_skip_shit_or_fail(stream, end_expression);
                    continue;
                }
                else {
                    var arg = _parse(next, stream, meta);
                }
                if (isArray(arg)) {
                    next = stream.next;
                    arg = arg[0];
                }
                else
                    next = next_and_skip_shit_or_fail(stream, ")");
                if (!~[43 /* MemberAccessExpression */, 80 /* ArgumentsObject */, 54 /* Symbol */, 75 /* SymbolNoPrefix */].indexOf(arg.name)) {
                }
                args.push(arg);
                if (next[0] === 4 /* Special */) {
                    if (next[1] === ")") {
                        break;
                    }
                    else if (next[1] !== ",") {
                        error_unexcepted_token(next);
                    }
                }
                else
                    error_unexcepted_token(next);
                next = next_and_skip_shit_or_fail(stream, "symbol");
            }
        }
        next = next_and_skip_shit_or_fail(stream, "{");
        if (next[0] !== 4 /* Special */ && next[1] !== "{") {
            error_unexcepted_token(next);
        }
        var body = parse_body(stream, meta);
        return {
            name: 81 /* KeepStatment */,
            type: 0 /* Statment */,
            body: body,
            args: args
        };
    },
    "new": function (stream, meta) {
        var expression = __parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta), is_array;
        if (is_array = isArray(expression)) {
            expression = expression[0];
        }
        // The logic is to intercept from parsed node last CallExpression and mutate it into NewExpression
        var node = { name: 83 /* NewExpression */, type: 1 /* Expression */, body: [expression] }, body = expression.body, intercepted = [], expression_ = expression;
        while (expression_.type === 1 /* Expression */ && isArray(body)) {
            expression_ = body[0].name ? body[0] : body[0].body;
            intercepted.push(expression_);
            body = expression_.body;
        }
        for (var index = 0, length = intercepted.reverse().length; index < length; index++) {
            var intercepted_ = intercepted[index];
            if (intercepted_.name === 41 /* CallExpression */) {
                var expressionAbove = intercepted[index + 1] || expression;
                node.body[0] = intercepted_;
                if (expressionAbove.name !== 43 /* MemberAccessExpression */) {
                    expressionAbove.body[0] = node;
                }
                else {
                    expressionAbove.body[0] = {
                        body: node,
                        kind: 0 /* Head */
                    };
                }
                return expression;
            }
        }
        return is_array ? [node] : node;
    }
};
/**
 * Checks if expression is an abrupt node ([Node]) and
 * returns abrupt node with body with abrupted expression
 * else returns node with body equal to passed expression
 */
function abruptify(node, expression) {
    if (isArray(expression)) {
        assert(node);
        node.body = expression;
        node = [node];
    }
    else {
        assert(node);
        node.body = [expression];
    }
    return node;
}
function parse_common_expressions(_sym, next, stream, meta) {
    var parsed, node, name = CommonOperatorTable[next[1]];
    if (name) {
        parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
        node = {
            name: name,
            type: 1 /* Expression */,
            body: [_sym, parsed],
            symbolName: next[1]
        };
        if (name === 29 /* ExponentiationExpression */) {
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
function parse_assignment(_sym, next, stream, meta) {
    var _a, _b;
    if (name = AssignmentOperatorTable[next[1]]) {
        if (_sym.name === 43 /* MemberAccessExpression */) {
            var body = _sym.body;
            var length = body.length;
            var name, parsed, node;
            for (var index = 0, item; index < length; index++) {
                item = body[index];
                if (item.kind === 3 /* Optional */ || item.kind === 4 /* OptionalComputed */) {
                    diagnostics.push(Diagnostic(2 /* RuntimeError */, "The left-hand side of an assignment expression may not be an optional property access."));
                }
            }
        }
        parsed = _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
        node = {
            name: name,
            type: 1 /* Expression */,
            body: [_sym, parsed],
            symbolName: next[1]
        };
        if (_sym.name !== 43 /* MemberAccessExpression */ &&
            !~meta.outer.locals.indexOf(_sym.symbolName) &&
            !~((_b = (_a = meta.outer.nonlocals) === null || _a === void 0 ? void 0 : _a.indexOf(_sym.symbolName)) !== null && _b !== void 0 ? _b : -1)) {
            meta.outer.locals.push(_sym.symbolName);
        }
        return node;
    }
}
var end_expression = _echo("expression");
var js_auto_variables = ["__external_var", "this", "arguments", "null", "NaN", "undefined", "Infinity", "true", "false"];
/**
 * @param {import("./utils/stream.js").Token | import("./parser").Node} next
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 * @returns {import("./parser").Node | [import("./parser").Node]}
 */
function _parse(next, stream, meta) {
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
function __parse(next, stream, meta) {
    var prefix;
    /**@type {import("./parser").Node}*/
    var node;
    // @ts-ignore
    if (next[0] === 8 /* Keyword */ && !includes(js_auto_variables, next[1])) {
        assert(next);
        return keywordsHandlers[next[1]](stream, meta);
        // @ts-ignore
    }
    else if (next[0] === 1 /* Number */) {
        assert(next);
        var _temp = next[1];
        return {
            name: 51 /* NumberValue */,
            type: 1 /* Expression */,
            body: _temp
        };
        // @ts-ignore
    }
    else if (next[0] === 9 /* Range */) {
        assert(next);
        var splitted = next[1].split('..');
        return {
            name: 60 /* RangeValue */,
            type: 1 /* Expression */,
            body: splitted.map(function (v) { return ({ name: 53 /* StringValue */, type: 1 /* Expression */, body: v }); })
        };
        // @ts-ignore
    }
    else if (next[0] === 0 /* String */) {
        assert(next);
        return {
            name: 53 /* StringValue */,
            type: 1 /* Expression */,
            body: next[1]
        };
    }
    else if (isNode(next) || isSymbol(next)) {
        meta.insideExpression = true;
        var parsed, _sym;
        if (isNode(next)) {
            _sym = next;
        }
        else if (next[0] === 8 /* Keyword */) {
            _sym = keywordsHandlers[next[1]](stream); // Only __external_var and this handlers can be invoked here
        }
        else {
            _sym = {
                name: 54 /* Symbol */,
                type: 1 /* Expression */,
                symbolName: next[1]
            };
        }
        next = next_and_skip_shit_or_fail(stream, end_expression);
        if (next[0] === 8 /* Keyword */ && next[1] === "with") {
            return [_sym];
        }
        if (next[0] !== 3 /* Operator */ && next[0] !== 4 /* Special */ && next[0] !== 0 /* String */) {
            error_unexcepted_token(next);
        }
        if (next[0] === 0 /* String */) {
            return {
                name: 41 /* CallExpression */,
                type: 1 /* Expression */,
                body: [_sym],
                args: [{
                        name: 53 /* StringValue */,
                        type: 1 /* Expression */,
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
                    name: next[1] === "(" ? 41 /* CallExpression */ : 42 /* OptionalCallExpression */,
                    type: 1 /* Expression */,
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
                if (_sym.name !== 54 /* Symbol */) {
                    throw SyntaxError("Arrow functions shortcut cannot contain non-symbol parameter");
                }
                node = {
                    name: 0 /* FunctionExpression */,
                    type: 1 /* Expression */,
                    params: [{ name: _sym.symbolName, type: 0 /* Normal */ }],
                    locals: [],
                    nonlocals: []
                };
                var innerMeta = { outer: node, filename: meta.filename };
                next = next_and_skip_shit_or_fail(stream, end_expression);
                if (next[0] !== 4 /* Special */ && next[1] !== "{") {
                    return abruptify(node, abruptify({
                        name: 64 /* ReturnStatment */,
                        type: 0 /* Statment */
                    }, _parse(next, stream, innerMeta)));
                }
                else {
                    return (node.body = parse_body(stream, innerMeta), node);
                }
            case "::":
                prefix = "Argument binding expression: ";
                next = next_and_skip_shit_or_fail(stream, "(", prefix);
                if (next[0] !== 4 /* Special */ || next[1] !== "(") {
                    error_unexcepted_token(next);
                }
                next = next_and_skip_shit_or_fail(stream, ")", prefix);
                var args = parse_call_expression(next, stream, meta);
                return {
                    name: 79 /* ArgumentBindingExpression */,
                    type: 1 /* Expression */,
                    body: [_sym],
                    args: args
                };
            case "!":
                node = _parse({
                    name: 85 /* NullAssertionExpression */,
                    type: 1 /* Expression */,
                    body: [_sym]
                }, stream, meta);
                __used.na = true;
                return node;
            default:
                parsed = parse_common_expressions(_sym, next, stream, meta) || parse_assignment(_sym, next, stream, meta);
                var _ = parsed && parsed.body;
                if (_ && parsed.symbolName && isArray(_[1])) {
                    assert(_);
                    _[1] = _[1][0];
                    parsed = [parsed];
                }
                return parsed || _sym;
        }
    }
    else if (next[0] === 7 /* Comment */ || next[0] === 10 /* MultilineComment */ || next[0] === 6 /* Whitespace */) {
    }
    else if (next[0] === 4 /* Special */ && ~[";", ")", "}", ","].indexOf(next[1])) {
        // throw +(next[1] === ",");
    }
    else if (next[0] === 4 /* Special */) {
        if (next[1] === "{") {
            return {
                name: 82 /* CodeBlock */,
                type: 0 /* Statment */,
                body: parse_body(stream, meta)
            };
        }
    }
    else if (next[0] === 3 /* Operator */) {
        meta.insideExpression = true;
        switch (next[1]) {
            case "[":
                node = {
                    name: 77 /* Array */,
                    type: 1 /* Expression */,
                    body: []
                };
                /**@type {any} */
                var body = node.body;
                assert(body);
                while (1) {
                    next = next_and_skip_shit_or_fail(stream, end_expression);
                    if (next[0] === 4 /* Special */ && next[1] === ",") {
                        body.push({
                            name: 48 /* UndefinedValue */,
                            type: 1 /* Expression */
                        });
                        continue;
                    }
                    else if (next[0] === 3 /* Operator */ && next[1] === "]") {
                        break;
                    }
                    parsed = _parse(next, stream, meta);
                    if (isArray(parsed)) {
                        next = stream.next;
                        parsed = parsed[0];
                    }
                    else
                        next = next_and_skip_shit_or_fail(stream, ']" or ",');
                    if ((next[0] !== 4 /* Special */ || next[1] !== ",") &&
                        (next[0] !== 3 /* Operator */ || next[1] !== ']')) {
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
    return undefined;
}
function isSymbol(next) {
    return next[0] === 2 /* Symbol */ || next[0] === 8 /* Keyword */ && includes(js_auto_variables, next[1]);
}
function remove_trailing_undefined(values) {
    for (var index = values.length; index && values[--index].name === 48 /* UndefinedValue */;)
        values.pop();
}
function error_unexcepted_token(next, rest) {
    if (rest === void 0) { rest = ""; }
    throw SyntaxError("Unexcepted token '" + next[1] + "'" + rest);
}
function parse_call_expression(next, stream, meta) {
    var arg, args = [];
    if (next[0] !== 4 /* Special */ || next[1] !== ")") {
        while (1) {
            if (next[0] === 4 /* Special */ && next[1] === ")") {
                break;
            }
            if (next[0] === 4 /* Special */ && next[1] === ",") {
                args.push({
                    name: 48 /* UndefinedValue */,
                    type: 1 /* Expression */
                });
                next = next_and_skip_shit_or_fail(stream, end_expression);
                continue;
            }
            else {
                arg = _parse(next, stream, meta);
            }
            if (isArray(arg)) {
                next = stream.next;
                arg = arg[0];
            }
            else
                next = next_and_skip_shit_or_fail(stream, ")");
            args.push(arg);
            if (next[0] === 4 /* Special */) {
                if (next[1] === ")") {
                    break;
                }
                else if (next[1] !== ",") {
                    error_unexcepted_token(next);
                }
            }
            else
                error_unexcepted_token(next);
            next = next_and_skip_shit_or_fail(stream, end_expression);
        }
    }
    return args;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
function parse_body(stream, meta) {
    var next = next_and_skip_shit_or_fail(stream, "}"), tokens = [];
    //console.log(1123124);
    while ((next /*, console.log("next:", next), next*/)[0] !== 4 /* Special */ || next[1] !== "}") {
        // console.log(next);
        try {
            var _parsed = _parse(next, stream, meta);
            if (isArray(_parsed)) {
                _parsed[0] && tokens.push(_parsed[0]);
                next = stream.next;
                if (next[0] === 4 /* Special */ && next[1] === "}") {
                    break;
                }
            }
            else {
                _parsed && tokens.push(_parsed);
                next = next_and_skip_shit_or_fail(stream, "}");
            }
        }
        catch (_e) {
            if (_e === 1) {
                break;
            }
            else if (_e === 0) {
                break;
            }
            else {
                diagnostics.push(Diagnostic(3 /* Error */, String(_e)));
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
function parse_any(stream, meta) {
    return null;
}
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {import("./parser").ParseMeta} meta
 */
function parse_expression(stream, meta) {
    return _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
}
// var __line = 0;
// var __column = 0;
/**@type {import("./parser").Node} */
var __top_fn_node;
var diagnostics = [];
var promises = [];
var __cache = true;
var __used;
/**
 * @param {import("./utils/stream.js").TokenList} lexed
 * @param {string} filename
 * @returns {import("./parser").ParserOutput | Promise<import("./parser").ParserOutput>}
 */
export function parse(lexed, filename, cache) {
    resetCounter();
    __cache = cache;
    var stream = Stream(lexed);
    // __line = __column = 0;
    __top_fn_node = {
        name: 2 /* AsyncFunctionExpression */,
        type: 1 /* Expression */,
        params: [{ name: "u", type: 3 /* NoPrefix */ }],
        locals: []
    };
    __used = {};
    __top_fn_node.body = main_parse(stream, filename, __top_fn_node);
    var output = {
        diagnostics: diagnostics,
        output: __top_fn_node,
        __used: __used
    };
    return promises.length ? Promise.all(promises).then(function () { return output; }) : output;
}
/* それは、にんげんはかたちをした〈モノ〉 */
/**
 * @param {import("./utils/stream.js").TokenStream} stream
 * @param {string} filename
 * @param {import("./parser").Node} outer
 */
function main_parse(stream, filename, outer) {
    var parsed = [], next;
    while (!nullish(next = stream.next)) {
        // try {
        // var newlines = occurrences(next[1], '\n');
        // var __line_cache = __line += newlines;
        // if (newlines <= 0) {
        //     __column = 0;
        // }
        // var __column_cache = __column += next[1].length - next[1].lastIndexOf("\n");
        try {
            var _parsed = _parse(next, stream, { outer: outer, filename: filename });
            _parsed && parsed.push(isArray(_parsed) ? _parsed[0] : _parsed);
        }
        catch (error) {
            diagnostics.push(Diagnostic(error && typeof error !== "string" && !(error instanceof SyntaxError) ?
                4 /* FatalError */ :
                3 /* Error */, error));
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
