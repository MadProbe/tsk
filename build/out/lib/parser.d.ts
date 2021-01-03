/** @author MadProbe#7435 */
import { TokenList, TokenStream } from "./utils/stream.js";
import { Nodes, ParameterNodeType, NodeType, AccessChainItemKind } from "./enums";
import { IDiagnostic } from "./utils/diagnostics.js";
export declare type NodeName = Nodes;
export interface Node {
    name: NodeName;
    type: NodeType;
    body?: string | Node[] | AccessChainItem[];
    outerBody?: Node;
    params?: ParameterNode[];
    symbolName?: string;
    meta?: Record<string, unknown>;
    args?: Node[];
    locals?: string[];
    nonlocals?: string[];
    else?: Node;
    elseif?: Node;
}
export interface ClassProperty {
    name: Node;
    body: Node;
}
export interface ClassMethod extends ClassProperty {
    body: Node[];
    decorators: Node[];
    params: ParameterNode[];
}
export interface ClassGetter extends ClassMethod {
    params: [];
}
export interface ClassSetter extends ClassMethod {
    params: [] | [ParameterNode & {
        type: ParameterNodeType.Normal;
    }];
}
export interface ClassConstructor {
    body: Node[];
    params: ParameterNode[];
}
export interface ClassNodeProperty extends ClassProperty {
    body: Node;
}
export interface ClassNodeProps {
    methods: ClassMethod[];
    getters: ClassGetter[];
    settets: ClassSetter[];
    props: [Node, Node][];
}
export interface ClassNode extends Node, Privatify<ClassNodeProps> {
    construct?: ClassConstructor;
    extends?: Node;
    mixins: Node[];
}
export interface MixinNode extends ClassNode {
}
export declare type PrivatifyString<T extends string> = T | `private${Capitalize<T>}`;
export declare type Privatify<T extends object> = {
    [Key in keyof T as PrivatifyString<Key extends string ? Key : never>]: T[Key];
};
export interface ParseMeta {
    insideExpression?: boolean;
    outer: Node;
    filename: string;
    [key: string]: unknown;
}
export interface ParameterNode {
    name: string | Node;
    type: ParameterNodeType;
    default?: Node;
    _meta?: any;
}
export interface AccessChainItem {
    kind: AccessChainItemKind;
    body: Node;
}
export declare type SyntaxTree = Node[];
export interface KeywordParsers {
    [name: string]: (stream: TokenStream, filename: string) => Node;
}
export interface ParserOutput {
    output: Node;
    diagnostics: IDiagnostic[];
    __used: any;
}
/**
 * @param {import("./utils/stream.js").TokenList} lexed
 * @param {string} filename
 * @returns {import("./parser").ParserOutput | Promise<import("./parser").ParserOutput>}
 */
export declare function parse(lexed: TokenList, filename: string, cache: boolean): ParserOutput | Promise<ParserOutput>;
