export type CallFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T>) => ReturnType<T>;
export type ApplyFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, args: Parameters<T> | IArguments) => ReturnType<T>;
export type BindFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T> | undefined[]) => T;
var __call = nullish.call;
export var bind = __call.bind(nullish.bind) as BindFunctionType;
export var call = bind(__call, __call as any) as CallFunctionType;
export var apply = bind(__call, nullish.apply as any) as ApplyFunctionType;
type ArrayValueType<T extends any[] | readonly any[]> = {
    [key in Exclude<keyof T, keyof []>]: T[key];
} extends { [key: string]: infer V } ? V : never;
export function includes<A extends any[] | readonly any[]>(array: A, value: unknown): 
    value is any[] extends A ? boolean : ArrayValueType<A> {
    return ~array.indexOf(value) as unknown as boolean;
}
export function nullish(arg: unknown): arg is null | undefined {
    return arg === void 0 || arg === null;
}
/**
 * Another trick related to compression by babel
 */
export function _echo<T>(value: T): T {
    return value;
}
export var undefined: undefined;
var __counter__ = 0;
export function randomVarName() {
    return `_${ (__counter__++).toString(36) }`; // + "__" + Math.random().toString(16).slice(2);
}
export function resetCounter() {
    __counter__ = 0;
}
export function assert<T>(value: unknown): asserts value is T { }
export function log_errors(errors: any[]) {
    if (errors && errors.length) {
        for (var index = 0; index < errors.length; index++) {
            console.error("TSK Error:", errors[index]);
        }
    }
}
export var isArray = Array.isArray as (<T>(arg: any) => arg is T[]) || (function (value) {
    return value instanceof Array;
});
interface CacheEntry {
    code: string;
    mtime: number;
}
var __cache = {} as { [key: string]: CacheEntry; };
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
                var mtime = fs.statSync(path).mtimeMs, cached = __cache[String(path)] || {}, cacheMTime = cached.mtime;
                if (mtime !== cacheMTime) {
                    _ = fs.readFileSync(path, "utf-8");
                    __cache[String(path)] = { mtime, code: _ };
                    return _;
                } else return cached.code;
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
        return fetch(String(path)).then(function (responce) {
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
var _SyntaxError = SyntaxError;
export { _SyntaxError as SyntaxError };
