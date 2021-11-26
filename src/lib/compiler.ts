import { IDiagnostic } from "./utils/diagnostics.js";
import { DiagnosticSeverity } from "./enums";
import { include } from "./utils/util.js";
import { parse, ParserOutput, pushDiagnostic } from "./parser.js";
import { emit } from "./emitter.js";
import { wrap } from "./wrapper.js";
import { lex } from "./lexer.js";

export interface CompilerOutput {
    readonly diagnostics: readonly IDiagnostic[];
    readonly output: string;
}
export interface CompilerOptions {
    readonly url?: string;
    readonly pretty?: boolean;
    readonly cache?: boolean;
}
/**
 * Complies tsk language code and transplies it into js code
 * @param {string} code tsk language code
 * @param {import("./compiler").CompilerOptions & { url: string }} opts Options passed to parser
 * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
 */
export function compileCode(code: string, opts: CompilerOptions): CompilerOutput | Promise<CompilerOutput> {
    var parsed = parse(lex(code), opts.url!, opts.cache ?? true);
    /**@param {import("../parser").ParserOutput} parsed */
    function _(parsed: ParserOutput) {
        var obj = {
            diagnostics: parsed.diagnostics,
            output: `/*#EMPTY${ Math.random() }*/`
        };
        try {
            obj.output = wrap(emit(parsed.output, opts), parsed.__used);
        } catch (error) {
            pushDiagnostic(DiagnosticSeverity.FatalError, error as never);
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
export default function compile(url: string | URL | import("url").URL, opts?: CompilerOptions): CompilerOutput | Promise<CompilerOutput> {
    var included = include(typeof url === "string" ? new URL(url) : url);
    opts ||= {};
    (opts as Record<string, unknown>).url ||= url.toString();
    if (typeof included === "string") {
        return compileCode(included, opts as CompilerOptions & { url: string; });
    } else return included.then(included => compileCode(included, opts as CompilerOptions & { url: string; }));
}
export * from "./lexer.js";
export { parse } from "./parser.js";
export * from "./wrapper.js";
export * from "./emitter.js";
export type { 
    ParserOutput, 
    SyntaxTree 
} from "./parser";
export type {
    AccessChainItem as AccessChainItem,
    IClassNode,
    ClassConstructor,
    ClassNodeProps,
    ClassProperty,
    ClassGetter,
    ClassSetter,
    ClassMethod,
    INode,
    INodeBase,
    NodeName,
    ITryStatmentNode,
    IUsingStatmentNode,
    MixinNode,
    IParameterNode as ParameterNode
} from "./nodes";
export type {
    AccessChainItemKind,
    Scopes,
    DiagnosticSeverity,
    ParameterNodeKind,
    NodeType,
    Nodes,
    Tokens,
    FunctionNodeKind,
    ParseNodeKind
} from "./enums";
export type {
    ArrayValueType
} from "./utils/util";
