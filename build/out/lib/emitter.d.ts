import { Node } from "./parser.js";
/**
 * @param {import("./parser").Node} node
 * @param {any} [meta]
 */
export declare function _emit(node: Node, meta: any): string;
export interface EmitterOptions {
    pretty?: boolean;
    url?: string;
}
/**
 * @param {import("./parser").Node} node
 * @param {import("./emitter").EmitterOptions} opts
 */
export declare function emit(node: Node, { pretty, url }?: EmitterOptions): string;
