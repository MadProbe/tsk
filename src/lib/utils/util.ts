import { js_auto_variables } from "./constants.js";
import { Nodes, Tokens } from "../enums";
import type { Token } from "./stream.js";
import type { INode } from "../nodes";

export type CallFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T>) => ReturnType<T>;
export type ApplyFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, args: Parameters<T> | IArguments) => ReturnType<T>;
export type BindFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T> | undefined[]) => T;
var __call = nullish.call;
export var bind = __call.bind(nullish.bind) as BindFunctionType;
export var call = bind(__call, __call as any) as CallFunctionType;
export var apply = bind(__call, nullish.apply as any) as ApplyFunctionType;
export type ArrayValueType<T extends readonly any[]> = {
    [key in Exclude<keyof T, keyof []>]: T[key];
} extends { [key: string]: infer V; } ? V : never;
export function includes<A extends readonly any[] | string>(array: A, value: unknown):
    value is A extends string ? string : any[] extends A ? boolean : ArrayValueType<Exclude<A, string>> {
    return ~array.indexOf(value as never) as never;
}
export function nullish(arg: unknown): arg is null | undefined {
    return arg === void 0 || arg === null;
}
export var undefined: undefined;
var __counter__ = 0;
export function random_var_name() {
    return `_${ (__counter__++).toString(36) }`; // + "__" + Math.random().toString(16).slice(2);
}
export function resetCounter() {
    __counter__ = 0;
}
export function assert_type<T>(value: unknown): asserts value is T { }
export var isArray = Array.isArray as (<T>(arg: any) => arg is T[]) || (function (value) {
    return value instanceof Array;
});
interface CacheEntry {
    code: string;
    mtime: number;
}
const __cache: Record<string, CacheEntry> = {};
// var __warned__ = false;
var __is_node = typeof process === "object" && ({}).toString.call(process) === "[object process]";
export function include(path: URL, cache = true): string | Promise<string> {
    var protocol = path.protocol, _: string;
    if (protocol === "file:") {
        if (__is_node) {
            if (typeof require !== "function") {
                throw "Please expose 'require' function into the global scope in order to use include statment";
            }
            var fs = require("fs") as typeof import("fs");
            if (cache) {
                var handle = fs.openSync(path, "r");
                var mtime = fs.fstatSync(handle).mtimeMs, cached = __cache[path.href] || {}, cacheMTime = cached.mtime;
                if (mtime !== cacheMTime) {
                    _ = fs.readFileSync(handle, "utf-8");
                    __cache[String(path)] = { mtime, code: _ };
                    fs.closeSync(handle);
                    return _;
                } else return fs.closeSync(handle), cached.code;
            } else {
                return fs.readFileSync(path, "utf-8");
            }
        } else {
            throw "Cannot access file:// urls in non-node env";
        }
    } else if (protocol === "http:" || protocol === "https:") {
        if (typeof fetch === "undefined") {
            if (__is_node) {
                global.fetch = require('node-fetch')["default"];
            } else {
                throw "Fetching web resource with no fetch function attached to global in web env!";
            }
        }
        // if (!__warned__) {
        //     console.warn("Since http requests are asynchronous i dont guarantee that include statment will work correctly (atleast please dont use them in web env)");
        //     __warned__ = true;
        // }
        return fetch(path.href).then(function (responce) {
            if (!responce.ok) {
                throw "Something went wrong while fetching " + path + "!";
            }
            return responce.text();
        });
    } else {
        throw "Unsupported protocol '" + protocol + "'!";
    };
}
export function inspectLog(shit: any) {
    console.log(typeof require === "function" ? require("util").inspect(shit, !0, 1 / 0, !0) : shit);
}
export function isSymbol(next: Token) {
    return next.type === Tokens.Symbol || next.type === Tokens.Keyword && includes(js_auto_variables, next.body);
}

export function remove_trailing_undefined(values: INode[]) {
    for (var index = values.length; index && values[--index].name === Nodes.UndefinedValue;) values.pop();
}

export function error_unexcepted_token(next: Token, rest = ""): never {
    assert(0, `Unexcepted token '${ next.body }'${ rest }`);
}

export function except_token(next: Token, token_type: Tokens, token_string?: string, rest = "") {
    if (((next.type & token_type) !== 0) && next.body !== token_string && token_string !== undefined) error_unexcepted_token(next, rest);
    return next;
}

export function assert(condition: 0 | false, message: string | { [Symbol.toPrimitive](hint: "string"): string; }, error_type?: ErrorConstructor): never;
export function assert(condition: unknown, message: string | { [Symbol.toPrimitive](hint: "string"): string; }, error_type?: ErrorConstructor): void;
export function assert(condition: unknown, message: string | { [Symbol.toPrimitive](hint: "string"): string; }, error_type: ErrorConstructor = _SyntaxError) {
    if (!condition) {
        throw error_type(message + "");
    }
}

/**
 * Checks if expression is an abrupt node ([Node]) and 
 * returns abrupt node with body with abrupted expression
 * else returns node with body equal to passed expression
 */
export function abruptify(node: INode, expression: INode | [INode]): INode {
    return node;
}
const _SyntaxError = SyntaxError;
export { _SyntaxError as SyntaxError };
