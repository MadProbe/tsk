import type { Nodes, ParameterNodeType, NodeType, AccessChainItemKind } from "./enums";



export type NodeName = Nodes;
export interface NodeBase {
    name: NodeName;
    type: NodeType;
}
export interface Node extends NodeBase {
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
export interface TryStatmentNode extends NodeBase {
    body: Node[];
    else: Node[];
    catch: [name: string, value: Node[]];
    finally: Node[];
}
export interface UsingStatmentNode extends TryStatmentNode {
    args: [indentifier: string, value: Node][];
}
export interface ClassProperty {
    name: Node;
    body: Node[];
}
export interface ClassMethod extends ClassProperty {
    decorators: Node[];
    params: ParameterNode[];
}
export interface ClassGetter extends ClassMethod {
    params: [];
}
export interface ClassSetter extends ClassMethod {
    params: [] | [ParameterNode & { type: ParameterNodeType.Normal; }];
}
export interface ClassConstructor {
    body: Node[];
    params: ParameterNode[];
    async: boolean;
    gen: boolean;
}
export interface ClassNodeProps {
    methods: ClassMethod[];
    getters: ClassGetter[];
    settets: ClassSetter[];
    props: [name: Node, value: Node][];
}
export interface ClassNode extends Node, Privatify<ClassNodeProps> {
    construct?: ClassConstructor;
    extends?: Node;
    mixins: Node[];
}
export interface MixinNode extends ClassNode { }
export type PrivatifyString<T extends string> = T | `private${ Capitalize<T> }`;
export type Privatify<T extends object> = {
    [Key in keyof T as PrivatifyString<Key extends string ? Key : never>]-?: T[Key];
};
export interface ParseMeta {
    ie?: boolean;
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
