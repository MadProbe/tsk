import { Diagnostic } from "./utils/diagnostics.js";
import { include } from "./utils/util.js";
import { parse } from "./parser.js";
import { emit } from "./emitter.js";
import { wrap } from "./wrapper.js";
import { lex } from "./lexer.js";
/**
 * Complies tsk language code and transplies it into js code
 * @param {string} code tsk language code
 * @param {import("./compiler").CompilerOptions & { url: string }} opts Options passed to parser
 * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
 */
export function compileCode(code, opts) {
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
export default function compile(url, opts) {
    var included = include(typeof url === "string" ? new URL(url) : url);
    opts || (opts = {});
    opts.url || (opts.url = url.toString());
    if (typeof included === "string") {
        return compileCode(included, opts);
    }
    else
        return included.then(function (included) { return compileCode(included, opts); });
}
export * from "./lexer.js";
export * from "./parser.js";
export * from "./wrapper.js";
export * from "./emitter.js";
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
