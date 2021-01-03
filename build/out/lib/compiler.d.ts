import { IDiagnostic } from "./utils/diagnostics.js";
export interface CompilerOutput {
    diagnostics: IDiagnostic[];
    output: string;
}
export interface CompilerOptions {
    url?: string;
    pretty?: boolean;
    cache?: boolean;
}
/**
 * Complies tsk language code and transplies it into js code
 * @param {string} code tsk language code
 * @param {import("./compiler").CompilerOptions & { url: string }} opts Options passed to parser
 * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
 */
export declare function compileCode(code: string, opts: CompilerOptions & {
    url: string;
}): CompilerOutput | Promise<CompilerOutput>;
/**
 * Complies tsk language code from given url and transplies it into js code
 * @param {string | URL | import("url").URL} url url to download code from
 * @param {import("./compiler").CompilerOptions} [opts] Options passed to parser
 * @returns {import("./compiler").CompilerOutput | Promise<import("./compiler").CompilerOutput>} js code & diagnostic messages
 */
export default function compile(url: string | URL | import("url").URL, opts?: CompilerOptions): CompilerOutput | Promise<CompilerOutput>;
export * from "./lexer.js";
export * from "./parser.js";
export * from "./wrapper.js";
export * from "./emitter.js";
export type { AccessChainItemKind, Scopes, DiagnosticSeverity, ParameterNodeType, NodeType, Nodes, Tokens, FNNodeType } from "./enums.js";
