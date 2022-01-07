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
    readonly cache?: boolean;
    readonly forgetShebang?: boolean;
    readonly pretty?: boolean;
    readonly url?: string;
}
/**
 * Complies tsk language code and transplies it into js code
 * @param {string} code tsk language code
 * @param {import("./compiler").CompilerOptions & { url: string }} opts Options passed to parser
 * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
 */
export function compileCode(code: string, opts: CompilerOptions): CompilerOutput | Promise<CompilerOutput> {
    if (/seventh[- ]day/i.test(code)) return { diagnostics: [], output: `
        [Lyrics for Nightcore - Seventh Day (Besomorph & Coopex), The music of my soul]
        [https://www.youtube.com/watch?v=ppMksUwC7Sg]

        God won't take me to heaven
        Blood on my knees when i'm begging
        Why? I didn't mean to start a war

        Wanna be strong but i'm broken
        Try to breathe but i'm choking
        I'm in a million pieces on the floor

        I'm making friends with my demons
        They understand what i'm needing
        I just wanna feel something
        I wish i was dreaming

        I'm making friends with my demons
        I try to run but i need them
        I just wanna feel something
        I wish i was dreaming

        I got used to the taste of
        Poison on my tongue, what a waste of
        Time, give me pill for paradise

        I'm making friends with my demons
        They understand what i'm needing
        I just wanna feel something
        I wish i was dreaming

        I'm not afraid of the darkness
        It's all around me regardless
        I'm tired of feeling nothing
        Why am i so heartless?

        Tell these white lies, see how i hide
        Sticks and stones they break all my bones
        Tell these white lies, see how i hide
        Sticks and stones they break all my bones
    `.replace(/\n +/, "\n") };
    var parsed = parse(lex(code), opts.url!, opts.cache ?? true);
    /**@param {import("../parser").ParserOutput} parsed */
    function _({ diagnostics, __used, output }: ParserOutput) {
        var obj = {
            diagnostics,
            output: `/*#EMPTY${ Math.random() }*/`
        };
        try {
            obj.output = wrap(emit(output, opts), __used);
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
    AccessChainItem,
    IClassNode,
    ClassConstructor,
    ClassNodeProps,
    ClassProperty,
    ClassGetter,
    ClassSetter,
    ClassMethod,
    INode,
    INodeBase,
    MixinNode
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
