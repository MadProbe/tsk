var compile = (function (exports) {
    'use strict';

    function Diagnostic(severity, message) {
        return {
            severity: severity,
            message: message
        };
    }

    var __call = nullish.call;
    var bind = __call.bind(nullish.bind);
    var call = bind(__call, __call);
    var apply = bind(__call, nullish.apply);
    function includes(array, value) {
        return ~array.indexOf(value);
    }
    function nullish(arg) {
        return arg === void 0 || arg === null;
    }
    /**
     * Another trick related to compression by babel
     */
    function _echo(value) {
        return value;
    }
    var undefined$1;
    var __counter__ = 0;
    function randomVarName() {
        return "_" + (__counter__++).toString(36); // + "__" + Math.random().toString(16).slice(2);
    }
    function resetCounter() {
        __counter__ = 0;
    }
    function assert(value) { }
    var isArray = Array.isArray || (function (value) {
        return value instanceof Array;
    });
    var __cache = {};
    // var __warned__ = false;
    var __is_node = typeof process === "object" && ({}).toString.call(process) === "[object process]";
    function include(path, cache) {
        if (cache === void 0) { cache = true; }
        var protocol = path.protocol, _;
        if (protocol === "file:") {
            if (__is_node) {
                if (typeof require !== "function") {
                    throw "Please expose 'require' function into the global scope in order to use include statment";
                }
                var fs = require("fs");
                if (cache) {
                    var mtime = fs.statSync(path).mtimeMs, cached = __cache[String(path)] || {}, cacheMTime = cached.mtime;
                    if (mtime !== cacheMTime) {
                        _ = fs.readFileSync(path, "utf-8");
                        __cache[String(path)] = { mtime: mtime, code: _ };
                        return _;
                    }
                    else
                        return cached.code;
                }
                else {
                    return fs.readFileSync(path, "utf-8");
                }
            }
            else {
                throw "Cannot access file:// urls in non-node env";
            }
        }
        else if (protocol === "http:" || protocol === "https:") {
            if (typeof fetch === "undefined") {
                if (__is_node) {
                    global.fetch = require('node-fetch')["default"];
                }
                else {
                    throw "Fetching web resource with no fetch function attached to global in web env!";
                }
            }
            // if (!__warned__) {
            //     console.warn("Since http requests are asynchronous i dont guarantee that include statment will work correctly (atleast please dont use them in web env)");
            //     __warned__ = true;
            // }
            return fetch(String(path)).then(function (responce) {
                if (!responce.ok) {
                    throw "Something went wrong while fetching " + path + "!";
                }
                return responce.text();
            });
        }
        else {
            throw "Unsupported protocol '" + protocol + "'!";
        }
    }
    var _SyntaxError = SyntaxError;

    /**
     * @template {import("./stream").Streamable} T
     * @param {T} streamable
     * @returns {T}
     */
    function Stream(streamable) {
        var __index = 0;
        return {
            next: streamable[0],
            /**@param {any} [__next]*/
            move: function (__next) {
                __next = streamable[__index++];
                this.next = streamable[__index];
                return __next;
            },
            down: function () {
                return this.next = streamable[--__index];
            }
        };
    }

    var keywords = _echo("do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof|include|fn|async|await|undefined|not|contains|__external|__external_var|nonlocal|keep").split("|");
    var validChars = /^[$\w_][\d\w$_]*$/m;

    var numberChar = /[0-9.\-\+]/;
    var numberTest = /^(?:[\-\+]?[0-9][_0-9]*)?(?:\.(\.[\-\+]?)?[0-9_]+)?$/m;
    var specialCharsTest = /[(){};,]/m;
    var operatorCharsTest = /^[<>\/*+\-?|&\^!%\.@:=\[\]~#]$/m;
    var regexTest = /^`$/m;
    var stringTest = /^'|"$/m;
    var regexModTest = /^[gmiyus]$/m;
    var whitespaceTest = /\s/;
    var $2charoperators = ["&&", "**", "||", "??", "==", "!=", "=>", "<=", ">=", "..", "+=", "/=", "&=", "-=", "++", "--", "*=", "|=", "//", ">>", "<<", "?.", "%=", "^=", "|>", "@@", "/*", "::", "!.", "!["];
    var $3charoperators = ["?.[", "?.(", "??=", "||=", "&&=", "**=", ">>>", "...", ">>=", "<<=", "===", "!=="];
    var symbolic = /^[^\s<>\/*+\-?|&\^!%\.@:=\[\]~(){};,"'#]$/m;
    // /**
    //  * @param {any[]} array
    //  * @param {any} element
    //  * @param {number} length
    //  */
    // function has(array, element, length) {
    //     for (let index = 0; index < length; index++) {
    //         if (element === array[index]) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    /**
     * @param {string} firstChar
     * @param {import("./utils/stream").TextStream} iter
     * @returns {import("./utils/stream").Token}
     */
    function scanNumber(firstChar, iter) {
        var result = firstChar, c;
        while (!nullish(c = iter.next) && numberChar.test(c)) {
            result += iter.move();
        }
        if (!numberTest.test(result) || !result) {
            throw result + " is not a valid number!";
        }
        return [/[\-\+]?\d+\.\.[\-\+]?\d+/.test(result) ? 9 /* Range */ : 1 /* Number */, result];
    }
    /**
     * @param {string} quot
     * @param {import("./utils/stream").TextStream} iter
     */
    function scanText(quot, iter) {
        var result = "", last = "", compound = '\\' + quot;
        while (iter.next !== quot || last + iter.next === compound) {
            last = iter.move();
            if (nullish(last)) {
                throw "Unexcepted EOF";
            }
            result += last;
        }
        iter.move();
        return result;
    }
    /**
     * @param {string} char
     * @param {import("./utils/stream").TextStream} iter
     * @returns {import("./utils/stream").Token}
     */
    function scanSymbol(char, iter) {
        var result = char, next;
        while (!nullish(next = iter.next) && symbolic.test(next)) {
            result += iter.move();
        }
        if (!validChars.test(result)) {
            throw result + " is not a valid symbol!";
        }
        return [~keywords.indexOf(result) ? 8 /* Keyword */ : 2 /* Symbol */, result];
    }
    /**
     * @param {string} char
     * @param {import("./utils/stream").TextStream} iter
     */
    function scanWhitespace(char, iter) {
        var result = char, next;
        while (!nullish(next = iter.next) && whitespaceTest.test(next)) {
            result += iter.move();
        }
        return result;
    }
    /**
     * @param {import("./utils/stream").TextStream} iter
     * @returns {import("./utils/stream").Token}
     */
    function scanRegex(iter) {
        var result = "", regexMods = "", next;
        while ((next = iter.next) !== '`') {
            if (nullish(next)) {
                throw "Invalid regular expression: missing `";
            }
            result += iter.move();
        }
        iter.move();
        // TS thinks that stream's next property doesn't change
        // @ts-ignore
        while (!~regexMods.indexOf(next = iter.next) && next.trim() && next !== ";" && !whitespaceTest.test(next)) {
            if (!regexModTest.test(next))
                throw "Invalid regular expression flag: '" + next + "'";
            if (~regexMods.indexOf(next))
                throw "Duplicated regular expression flag: '" + next + "'";
            regexMods += iter.move();
        }
        return [5 /* Regex */, result, regexMods];
    }
    /**
     * @param {import("./utils/stream").TextStream} iter
     * @param {string} firstChar
     */
    function scanComment(iter, firstChar) {
        var result = firstChar || "";
        while (iter.next && iter.next !== '\n') {
            result += iter.move();
        }
        iter.move();
        return result + "\n";
    }
    /**
     * @param {import("./utils/stream").TextStream} iter
     * @param {string} firstChar
     */
    function scanMultiineComment(iter, firstChar) {
        var result = firstChar, length = 0;
        while (result[length] + iter.next !== '*/') {
            result += iter.move();
            length++;
        }
        iter.move();
        return result.slice(0, -1);
    }
    /**
     * @param {import("./utils/stream").TokenList} tokens
     * @param {string} char
     * @param {import("./utils/stream").TextStream} iter
     */
    function _lex(tokens, char, iter) {
        if (whitespaceTest.test(char)) {
            tokens.push([6 /* Whitespace */, scanWhitespace(char, iter)]);
        }
        else if (specialCharsTest.test(char)) {
            tokens.push([4 /* Special */, char]);
        }
        else if (operatorCharsTest.test(char) || char === ".") {
            _char = iter.move();
            joined = char + _char;
            if ((char === "-" || char === "+") && /^[\d\.]$/m.test(_char)) {
                _lex(tokens, joined, iter);
            }
            else if (~$2charoperators.indexOf(joined)) {
                __char = iter.move();
                _joined = joined + __char;
                if (~$3charoperators.indexOf(_joined)) {
                    ___char = iter.move();
                    __joined = _joined + ___char;
                    if (">>>=" === __joined) {
                        tokens.push([3 /* Operator */, __joined]);
                        _lex(tokens, iter.move(), iter);
                    }
                    else {
                        tokens.push([3 /* Operator */, _joined]);
                        _lex(tokens, ___char, iter);
                    }
                }
                else if (joined === "//") {
                    tokens.push([7 /* Comment */, scanComment(iter, __char)]);
                }
                else if (joined === "/*") {
                    tokens.push([10 /* MultilineComment */, scanMultiineComment(iter, __char)]);
                }
                else {
                    tokens.push([3 /* Operator */, joined]);
                    _lex(tokens, __char, iter);
                }
            }
            else {
                // console.log(`Char: '${char}', NextChar: '${_char}'`);
                tokens.push([3 /* Operator */, char]);
                _lex(tokens, _char, iter);
            }
        }
        else if (whitespaceTest.test(char)) {
            tokens.push([6 /* Whitespace */, scanWhitespace(char, iter)]);
        }
        else if (specialCharsTest.test(char)) {
            tokens.push([4 /* Special */, char]);
        }
        else if (regexTest.test(char)) {
            tokens.push(scanRegex(iter));
        }
        else if (stringTest.test(char)) {
            tokens.push([0 /* String */, scanText(char, iter)]);
        }
        else if (/[0-9\-\+]/.test(char)) {
            tokens.push(scanNumber(char, iter));
        }
        else if (validChars.test(char)) {
            tokens.push(scanSymbol(char, iter));
        }
        else {
            throw "Unrecognised character: \"" + char + "\"!";
        }
    }
    var _char, __char, ___char, joined, _joined, __joined;
    /**
     * @param {string} text
     */
    function lex(text) {
        /**@type {import("./utils/stream").TokenList} */
        var tokens = [], iter = Stream(text);
        while (!nullish(iter.next)) {
            _lex(tokens, iter.move(), iter);
        }
        return tokens;
    }

    var CommonOperatorTable = {
        "+": 24 /* AddictionExpression */,
        "-": 25 /* SubstractionExpression */,
        "*": 26 /* MultiplicationExpression */,
        "/": 27 /* DivisionExpression */,
        "%": 28 /* RemainderExpression */,
        "**": 29 /* ExponentiationExpression */,
        "&": 30 /* BitwiseANDExpression */,
        "^": 32 /* BitwiseXORExpression */,
        "|": 33 /* BitwiseORExpression */,
        "??": 34 /* NullishCoalescingExpression */,
        "&&": 35 /* LogicalANDExpression */,
        "||": 37 /* LogicalORExpression */,
        // "!": Nodes.LogicalNOTExpresssion, // Leaving this uncommented may lead to fun bugs 
        // expression ! expression will be parsed without compilation errors LOL
        "<<": 38 /* BitwiseLeftShiftExpression */,
        ">>": 39 /* BitwiseRightShiftExpression */,
        ">>>": 40 /* BitwiseUnsignedRightShiftExpression */,
        "::": 79 /* ArgumentBindingExpression */,
        ">": 70 /* GreaterThan */,
        ">=": 68 /* GreaterThanOrEqual */,
        "<": 69 /* LessThan */,
        "<=": 67 /* LessThanOrEqual */,
        "==": 65 /* LooseComparison */,
        "===": 66 /* StrictComparison */
    };
    var AssignmentOperatorTable = {
        "=": 7 /* AssignmentExpression */,
        "+=": 8 /* AddictionAssignmentExpression */,
        "-=": 9 /* SubstractionAssignmentExpression */,
        "*=": 10 /* MultiplicationAssignmentExpression */,
        "/=": 11 /* DivisionAssignmentExpression */,
        "%=": 12 /* RemainderAssignmentExpression */,
        "**=": 13 /* ExponentiationAssignmentExpression */,
        "&=": 14 /* BitwiseANDAssignmentExpression */,
        "^=": 15 /* BitwiseXORAssignmentExpression */,
        "|=": 16 /* BitwiseORAssignmentExpression */,
        "??=": 17 /* LogicalNullishCoalescingAssignmentExpression */,
        "&&=": 18 /* LogicalANDAssignmentExpression */,
        "||=": 19 /* LogicalORAssignmentExpression */,
        "<<=": 21 /* BitwiseLeftShiftAssignmentExpression */,
        ">>=": 22 /* BitwiseRightShiftAssignmentExpression */,
        ">>>=": 23 /* BitwiseUnsignedRightShiftAssignmentExpression */
    };

    // @ts-check
    var meberAccessOperators = [".", "?.", "!.", "![", "?.[", "["];
    function _parseMemberAccess(sym, next, stream, meta) {
        var chain = [{
                kind: 0 /* Head */,
                body: sym
            }];
        while (next[0] === 3 /* Operator */ && includes(meberAccessOperators, next[1])) {
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
        return chain;
    }
    function parseMemberAccess(sym, next, stream, meta) {
        return _parse({
            name: 43 /* MemberAccessExpression */,
            type: 1 /* Expression */,
            body: _parseMemberAccess(sym, next, stream, meta)
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
        var next = stream.next;
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
            var included = include(file, __cache$1);
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
                "else": undefined$1,
                elseif: undefined$1
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
                        throw _SyntaxError("Cannot append second rest parameter to " + (name ? "function " + name : "anonymous function"));
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
                diagnostics.push(Diagnostic(1 /* Warn */, "Class statment doesn't have a name - " +
                    "a random name will be given during compilation"));
                node.symbolName = randomVarName();
            }
            if (next[0] === 4 /* Special */ && next[1] === "{") {
                while ((next = next_and_skip_shit_or_fail(stream, ["keyword", "symbol", "string"].join('" | "'), prefix))[1] !== "}" &&
                    next[0] !== 4 /* Special */) {
                    if ([2 /* Symbol */, 0 /* String */, 8 /* Keyword */].indexOf(next[0])) {
                        var next2 = next_and_skip_shit_or_fail(stream, ["=", "symbol", "("].join('" | "'), prefix);
                        if (next[0] === 8 /* Keyword */)
                            if (next2[0] === 2 /* Symbol */ && includes(["get", "set", "async"], next[1])) ;
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
                        var next2, isConstantObject = next[0] === 8 /* Keyword */ && includes(["this", "arguments"], next[1]), arg = (isConstantObject ? keywordsHandlers[next[1]]() : {
                            name: 54 /* Symbol */,
                            type: 1 /* Expression */,
                            symbolName: next[1]
                        });
                        if (!(isConstantObject || next[0] === 2 /* Symbol */)) {
                            error_unexcepted_token(next);
                        }
                        next2 = next_and_skip_shit_or_fail(stream, [',', ')'].join('" | "') + meberAccessOperators.join('" | "'), prefix);
                        if (next2[0] === 3 /* Operator */ && includes(meberAccessOperators, next2[1])) {
                            arg = {
                                name: 43 /* MemberAccessExpression */,
                                type: 1 /* Expression */,
                                body: _parseMemberAccess(arg, next, stream, meta)
                            };
                        }
                        else {
                            isConstantObject && diagnostics.push(Diagnostic(2 /* RuntimeError */, "Assignment to \"" + next[0] + "\" will fail at runtime!"));
                            next = next2;
                        }
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
        },
        // TODO
        "try": function () {
            return undefined$1;
        }
    };
    /**
     * Checks if expression is an abrupt node ([Node]) and
     * returns abrupt node with body with abrupted expression
     * else returns node with body equal to passed expression
     */
    function abruptify(node, expression) {
        if (isArray(expression)) {
            node.body = expression;
            node = [node];
        }
        else {
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
            return keywordsHandlers[next[1]](stream, meta);
            // @ts-ignore
        }
        else if (next[0] === 1 /* Number */) {
            var _temp = next[1];
            _sym = {
                name: 51 /* NumberValue */,
                type: 1 /* Expression */,
                body: _temp
            };
            next = next_and_skip_shit_or_fail(stream, end_expression, "Number expression:");
            if (next[0] !== 3 /* Operator */ && next[0] !== 4 /* Special */) {
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
                    diagnostics.push(Diagnostic(2 /* RuntimeError */, "Call on number will fail at runtime because number is not callable."));
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
                case "?.[": {
                    var body_1 = next[1];
                    if (body_1 === ".") {
                        diagnostics.push(Diagnostic(1 /* Warn */, "Please disambiguate normal member access expression when member access " +
                            "performed on number value by wrapping nubmer value in parenthezis"));
                    }
                    if (includes(["!.", "![", "?.", "?.["], body_1)) {
                        var isDotMemberAccess = body_1 == "!." || body_1 == "?.";
                        diagnostics.push(Diagnostic(1 /* Warn */, (body_1 == "![" || body_1 == "!." ? "Null assertive" : "Optional") +
                            ((isDotMemberAccess ? "" : " computed") + " member access doesn't have ") +
                            "any effect when performed on number value, assertion will be stripped."));
                        next[1] = isDotMemberAccess ? "." : "[";
                    }
                    return parseMemberAccess({
                        name: 6 /* GroupExpression */,
                        type: 1 /* Expression */,
                        body: [_sym]
                    }, next, stream, meta);
                }
                case "=>":
                    if (_sym.name !== 54 /* Symbol */) {
                        throw _SyntaxError("Arrow functions shortcut cannot contain non-symbol parameter");
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
                    node = _parse(_sym, stream, meta);
                    diagnostics.push(Diagnostic(1 /* Warn */, "Null assertion expression doesn't have any effect on number value, " +
                        "null assertion operator will be stripped in output"));
                    return node;
                default:
                    parsed = parse_common_expressions(_sym, next, stream, meta);
                    if (next[1] in AssignmentOperatorTable) {
                        diagnostics.push(Diagnostic(2 /* RuntimeError */, "Assignment on number will fail at runtime."));
                        parsed = parse_assignment(_sym, next, stream, meta);
                    }
                    if (!parsed) {
                        diagnostics.push(Diagnostic(1 /* Warn */, "Operator \"" + next[1] + "\" is not supported"));
                        parsed = _sym;
                    }
                    var _ = parsed && parsed.body;
                    if (_ && parsed.symbolName && isArray(_[1])) {
                        _[1] = _[1][0];
                        parsed = [parsed];
                    }
                    return parsed;
            }
            // @ts-ignore
        }
        else if (next[0] === 9 /* Range */) {
            var splitted = next[1].split('..');
            return {
                name: 60 /* RangeValue */,
                type: 1 /* Expression */,
                body: splitted.map(function (v) { return ({ name: 53 /* StringValue */, type: 1 /* Expression */, body: v }); })
            };
            // @ts-ignore
        }
        else if (next[0] === 0 /* String */) {
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
                        throw _SyntaxError("Arrow functions shortcut cannot contain non-symbol parameter");
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
                    if (!parsed) {
                        diagnostics.push(Diagnostic(1 /* Warn */, "Operator \"" + next[1] + "\" is not supported"));
                        parsed = _sym;
                    }
                    var _ = parsed && parsed.body;
                    if (_ && parsed.symbolName && isArray(_[1])) {
                        _[1] = _[1][0];
                        parsed = [parsed];
                    }
                    return parsed;
            }
        }
        else if (next[0] === 7 /* Comment */ || next[0] === 10 /* MultilineComment */ || next[0] === 6 /* Whitespace */) ;
        else if (next[0] === 4 /* Special */ && ~[";", ")", "}", ","].indexOf(next[1])) ;
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
        return undefined$1;
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
        throw _SyntaxError("Unexcepted token '" + next[1] + "'" + rest);
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
    function parse_expression(stream, meta) {
        return _parse(next_and_skip_shit_or_fail(stream, end_expression), stream, meta);
    }
    // var __line = 0;
    // var __column = 0;
    /**@type {import("./parser").Node} */
    var __top_fn_node;
    var diagnostics = [];
    var promises = [];
    var __cache$1 = true;
    var __used;
    /**
     * @param {import("./utils/stream.js").TokenList} lexed
     * @param {string} filename
     * @returns {import("./parser").ParserOutput | Promise<import("./parser").ParserOutput>}
     */
    function parse(lexed, filename, cache) {
        resetCounter();
        __cache$1 = cache;
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
                diagnostics.push(Diagnostic(error && typeof error !== "string" && !(error instanceof _SyntaxError) ?
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

    // Adopted to ts by MadProbe#7435
    // All credits goes to Vitim.us 
    // @see {https://gist.github.com/victornpb/7736865}
    /** Function that count occurrences of a substring in a string;
     * @param {String} string               The string
     * @param {String} subString            The sub string to search for
     * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
     *
     * @author Vitim.us https://gist.github.com/victornpb/7736865
     * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
     * @see https://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
     */
    function occurrences(string, subString, allowOverlapping) {
        string += "";
        subString += "";
        if (subString.length <= 0)
            return (string.length + 1);
        var n = 0, pos = 0, step = allowOverlapping ? 1 : subString.length;
        while ((pos = string.indexOf(subString, pos)) >= 0) {
            ++n;
            pos += step;
        }
        return n;
    }

    var __pretty = true;
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
    function _emit(node, meta) {
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
        function emitSlicedArguments() {
            sp();
            __text += "__call([].slice,";
            sp();
            __text += "arguments";
            if (index || length !== 1) {
                __text += ",";
                sp();
                __text += -(length - index);
            }
            __text += ")[0]";
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
                    var node_1 = elementParams[index];
                    var namae = node_1.name;
                    if (node_1.type === 1 /* Rest */) {
                        break;
                    }
                    if (typeof namae === "string") {
                        __text += node_1.name = name = "" + (node_1.type === 3 /* NoPrefix */ ? "" : "$") + (namae || randomVarName());
                    }
                    else {
                        throw "Destructing parameters are not supported yet";
                        //__text += _emit(name as unknown as Node, meta);
                    }
                    if (index + 1 < length && elementParams[index + 1].type !== 1 /* Rest */) {
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
                    namae = node_2.name;
                    if (hadRestParam) {
                        if (typeof namae === "string") {
                            is();
                            __text += node_2.name = name = "" + (node_2.type === 3 /* NoPrefix */ ? "" : "$") + (namae || randomVarName());
                            if (node_2["default"]) {
                                var _tempVar = randomVarName();
                                declare(_tempVar);
                                sp();
                                __text += "=";
                                sp();
                                __text += "__nl(" + _tempVar;
                                sp();
                                __text += "=";
                                emitSlicedArguments();
                                __text += ")";
                                sp();
                                __text += "?";
                                sp();
                                __text += _emit(node_2["default"], meta);
                                sp();
                                __text += ":";
                                __text += _tempVar + ")";
                            }
                            else {
                                sp();
                                __text += "=";
                                emitSlicedArguments();
                            }
                            __text += index + 1 < length ? "," : ";";
                            nl();
                        }
                        else {
                            throw "Destructing parameters are not supported yet";
                            //__text += _emit(name as unknown as Node, meta);
                        }
                    }
                    if (node_2.type === 1 /* Rest */) {
                        hadRestParam = true;
                        is();
                        __text += "var " + ("$" + (namae || randomVarName()));
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
                        __text += ")" + (index + 1 < length ? "," : ";");
                        nl();
                        hadRestParam = true;
                    }
                    if (node_2["default"] && !hadRestParam) {
                        is();
                        __text += name || (name = typeof node_2.name === "string" ? node_2.name : _emit(node_2.name, meta));
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
                __text += body;
                break;
            case 5 /* ThrowExpression */:
                __text += "__throw(" + _emit(body[0], meta) + ")";
                break;
            case 53 /* StringValue */:
                __diff = occurrences(body, "'") >= occurrences(body, '"'), quote = __diff ? '"' : "'", rquote = __diff ? "'" : '"';
                __text += "" + quote + body.replace("\\" + rquote, rquote).replace("\n", "\\n") + quote;
                break;
            case 55 /* PipelineExpression */:
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
                __text += "(";
                length = body.length;
                index = 0;
                for (; index < length; index++) {
                    var node_4 = body[index];
                    __text += _emit(as_expression(node_4), meta);
                    if (index + 1 < length) {
                        __text += ",";
                        sp();
                    }
                }
                __text += ")";
                break;
            case 64 /* ReturnStatment */:
                __text += "return " + _emit(as_expression(body[0]), meta);
                break;
            case 60 /* RangeValue */:
                var s = +body[0].body, e = +body[1].body;
                __text += s === e ? "(function*(){})()" :
                    "(function*(){for(var i=" + s + ",e=" + e + ";i" + (s > e ? ">" : "<") + "e;i" + (s > e ? "--" : "++") + ")yield i})()";
                break;
            case 73 /* ExternalVariable */:
                __text += body;
                break;
            case 13 /* ExponentiationAssignmentExpression */:
                __text += _emit(body[0], meta);
                sp();
                __text += "=";
                sp();
            case 29 /* ExponentiationExpression */:
                __text += "Math.pow(" + _emit(body[0], meta) + ",";
                sp();
                __text += _emit(body[1], meta) + ")";
                break;
            case 7 /* AssignmentExpression */:
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
                __text += _emit(body[0], meta);
                sp();
                __text += node.symbolName;
                sp();
                __text += _emit(as_expression(body[1]), meta);
                break;
            case 44 /* IfStatment */:
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
                break;
            case 74 /* AwaitExpression */:
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
                __text += "[" + body.map(function (node) { return _emit(as_expression(node), meta); }).join("," + (__pretty ? " " : "")) + "]";
                break;
            case 79 /* ArgumentBindingExpression */:
                __text += "__bind(" + _emit(body[0], meta) + ",";
                sp();
                __text += "u,";
                sp();
                __text += node.args.map(function (node) { return _emit(as_expression(node), meta); }).join("," + (__pretty ? " " : "")) + ")";
                break;
            case 57 /* LiteralLogicalNotExpression */:
                _ = _emit(body[0], meta);
                __text += "!" + (isSimple(body[0]) ? _ : "(" + as_expression(_) + ")");
                break;
            case 81 /* KeepStatment */:
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
                __text += "__na(" + _emit(as_expression(body[0]), meta) + ")";
                break;
            case 83 /* NewExpression */:
                __text += "new " + _emit(as_expression(body[0]), meta);
                break;
            case undefined$1: {
                var sp_1 = meta.sp + "    ";
                __text += "/*\n" + sp_1 + "Cannot emit undefined, has something gone wrong?" +
                    ("\n" + sp_1 + "Stack trace:\n" + (sp_1 + ((_d = Error().stack) === null || _d === void 0 ? void 0 : _d.replace(/\n/g, "\n" + sp_1))) + "\n" + meta.sp + "*/");
                break;
            }
            case 84 /* ClassExpression */:
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
    function emit(node, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.pretty, pretty = _c === void 0 ? false : _c, _d = _b.url, url = _d === void 0 ? "" : _d;
        __pretty = pretty;
        // console.log(inspect(node, !0, 1 / 0, !0));
        return _emit(__top = node, { url: url });
    }

    var __async = "function __async(f,t,a){" +
        "return new p(function(r){" +
        "var g=__apply(f,t,a),n=g.next;" +
        "_();" +
        "function _(p){" +
        "var v=__call(n,g,p);" +
        "v.done?r(v.value):pr(v.value).then(function(v){_(v)})" +
        "}" +
        "})" +
        "}";
    var __null_assert = "function __na(v){if(n(v))throw TypeError(\"Null assertion\");return v}";
    var __nullish = "function n(v){return v===null||v===void 0}";
    var __contains = "function __contains(i,v){" + // i = iterable, v = value
        // _ = iterator, n = next method of _, t = temp variable
        "for(var _=i[Symbol.iterator](),n=__bind(_.next,_),t;!(t=n()).done;)if((t=t.value)===v||v!==v&&j!==t)return!0;" +
        "return!1}";
    function wrap(code, used) {
        return "(function(){var _=function(){},p=Promise,c=_.call,__bind=c.bind(_.bind)," +
            "pr=__bind(p.resolve,p),__call=__bind(c,c),__apply=__bind(c,_.apply);" +
            (__nullish + ";" + __async + ";" + (used.contains ? __contains + ";" : "") + (used.na ? __null_assert + ";" : "")) +
            ("return(" + code + ")()})()");
    }

    /**
     * Complies tsk language code and transplies it into js code
     * @param {string} code tsk language code
     * @param {import("./compiler").CompilerOptions & { url: string }} opts Options passed to parser
     * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
     */
    function compileCode(code, opts) {
        var _a;
        var parsed = parse(lex(code), opts.url, (_a = opts.cache) !== null && _a !== void 0 ? _a : true);
        /**@param {import("../parser").ParserOutput} parsed */
        function _(parsed) {
            var obj = {
                diagnostics: parsed.diagnostics,
                output: "/*#EMPTY" + Math.random() + "*/"
            };
            try {
                obj.output = wrap(emit(parsed.output, opts), parsed.__used);
            }
            catch (error) {
                obj.diagnostics.push(Diagnostic(4 /* FatalError */, error));
            }
            return obj;
        }
        return !(parsed instanceof Promise) ? _(parsed) : parsed.then(_);
    }
    /**
     * Complies tsk language code from given url and transplies it into js code
     * @param {string | URL | import("url").URL} url url to download code from
     * @param {import("./compiler").CompilerOptions} [opts] Options passed to parser
     * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
     */
    function compile(url, opts) {
        var included = include(typeof url === "string" ? new URL(url) : url);
        opts || (opts = {});
        opts.url || (opts.url = url.toString());
        if (typeof included === "string") {
            return compileCode(included, opts);
        }
        else
            return included.then(function (included) { return compileCode(included, opts); });
    }
    // declare const __時崎狂三__: typeof globalThis;
    // var getGlobal = () => {
    //     try {
    //         var global = Function("return this")() as typeof globalThis;
    //     } catch (error) {
    //         // This algorithm is used to get globalThis if none of code evaluators are available and globalThis variable is absent
    //         // Firstly, define our magic variable in Object prototype
    //         // Since global this prototype inherits from object prototype 
    //         // We can just get the global this by calling a getter,
    //         // Which gets called just by referencing magic variable name
    //         Object.defineProperty(({} as any).prototype, "__時崎狂三__", { 
    //             get() { return this; }, 
    //             // configurable is because we will need to delete this getter later
    //             configurable: true 
    //         });
    //         global = __時崎狂三__;
    //         // ts ignore because ts cannot understand js magic
    //         // @ts-ignore
    //         delete global.__時崎狂三__;
    //     }
    //     return (getGlobal = () => global)();
    // };
    // interface TSKComplierConfig {
    //     observeMutations: boolean;
    // }
    // declare global {
    //     var tsk_complier_config: TSKComplierConfig;
    // }
    // if (typeof window === "object" && window === (typeof globalThis === "object" ? globalThis : getGlobal())) {
    //     const loaded = [];
    //     getGlobal().tsk_complier_config = {
    //         observeMutations: false
    //     };
    // } else {
    // }

    exports._emit = _emit;
    exports.compileCode = compileCode;
    exports.default = compile;
    exports.emit = emit;
    exports.lex = lex;
    exports.parse = parse;
    exports.wrap = wrap;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
