import type { Nodes, ParameterNodeKind, NodeType, AccessChainItemKind, ObjectBodyNodeKind } from "./enums";



export type NodeName = Nodes;
export interface INodeBase {
    name: NodeName;
    type: NodeType;
}
export interface INode extends INodeBase {
    body?: INode[] | AccessChainItem[] | Record<string, unknown>[];
    outerBody?: INode;
    params?: IParameterNode[];
    symbol?: string;
    meta?: Record<string, unknown>;
    args?: INode[];
    locals?: string[];
    nonlocals?: string[];
    else?: INode;
    elseif?: INode;
}
export abstract class Node implements INode {
    public abstract body?: INode[] | AccessChainItem[] | Record<string, unknown>[];
    public abstract outerBody?: INode;
    public abstract params?: IParameterNode[];
    public abstract symbol?: string;
    public abstract meta?: Record<string, unknown>;
    public abstract args?: INode[];
    public abstract locals?: string[];
    public abstract nonlocals?: string[];
    public abstract else?: INode;
    public abstract elseif?: INode;
    public constructor(public readonly name: NodeName, public readonly type: NodeType) { }
}
export interface ITryStatmentNode extends INodeBase {
    body: INode[];
    else: INode[];
    catch: [name: string, value: INode[]];
    finally: INode[];
}
export interface IUsingStatmentNode extends ITryStatmentNode {
    args: [indentifier: string, value: INode][];
}
export interface ClassProperty {
    name: INode;
    body: INode[];
}
export interface ClassMethod extends ClassProperty {
    decorators: INode[];
    params: IParameterNode[];
}
export interface ClassGetter extends ClassMethod {
    params: [];
}
export interface ClassSetter extends ClassMethod {
    params: [] | [IParameterNode & { kind: ParameterNodeKind.Normal; }];
}
export interface ClassConstructor {
    body: INode[];
    params: IParameterNode[];
    async: boolean;
    gen: boolean;
}
export interface ClassNodeProps {
    methods: ClassMethod[];
    getters: ClassGetter[];
    settets: ClassSetter[];
    props: { name: INode; value: INode }[];
}
export interface IClassNode extends INode, Privatify<ClassNodeProps> {
    construct?: ClassConstructor;
    extends?: INode;
    mixins: INode[];
}
export interface MixinNode extends IClassNode { }
export type PrivatifyString<T extends string> = T | `private${ Capitalize<T> }`;
export type Privatify<T extends object> = {
    [Key in keyof T as PrivatifyString<Key extends string ? Key : never>]-?: T[Key];
};
export interface IParseMeta {
    /** insideExpression */
    insideExpression: boolean;
    readonly outer: INode;
    readonly filename: string;
    readonly cache: boolean;
    [key: string]: unknown;
}
export class ParseMeta implements IParseMeta {
    constructor(public readonly filename: string, public readonly outer: INode, public readonly cache: boolean, public insideExpression = false) {};
    [key: string]: unknown;
}
export interface IParameterNode {
    name: string | INode;
    kind: ParameterNodeKind;
    default?: INode;
    _meta?: Record<string, unknown>;
}
export class ParameterNode {
    public readonly default?: INode;
    constructor(public readonly name: string | INode, public readonly kind: ParameterNodeKind, default_: INode | undefined) {
        this.default = default_;
    }
}
export class AccessChainItem {
    constructor(public kind: AccessChainItemKind, public body: INode) { }
}
export type ObjectBodyNode = {
    name: INode;
    type: ObjectBodyNodeKind;
    body: INode[];
};
export interface ObjectNode extends INodeBase {
    name: Nodes.ObjectExpression;
    type: NodeType.Expression;
    body: ObjectBodyNode[];
}
