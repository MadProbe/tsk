import { undefined } from "./util.js";
import type { Node } from "../nodes.js";


export class Scope<Global extends boolean = false> {
    public readonly variables = new Map<string, never>();
    public readonly nonlocals: Global extends true ? undefined : Map<string, never> = new Map<string, never>() as never;
    public readonly globals: Global extends true ? undefined : Map<string, never> = new Map<string, never>() as never;
    public readonly externs: Global extends true ? Map<string, never> : undefined = new Map<string, never>() as never;

    public constructor(public readonly func: Global extends true ? undefined : Node) { }
    addVariable(variable: string) {
        this.nonlocals?.has(variable) || this.externs?.has(variable) || this.variables.set(variable, undefined!);
    }
    viewVariables() {
        return this.variables.keys();
    }
    [Symbol.iterator]() { return this.variables.keys(); }
    viewExternals() {
        return this.externs?.keys();
    }
}
