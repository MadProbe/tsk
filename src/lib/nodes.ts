import { Nodes, type ParameterNodeKind, NodeType, type AccessChainItemKind, type ObjectBodyNodeKind } from "./enums";
import { undefined } from "./utils/util.js";


type NodeBody = INode[] | AccessChainItem[] | undefined;
export type Writable<T> = { -readonly [K in keyof T]: T[K] };

export interface INodeBase {
    name: Nodes;
    type: NodeType;
}

export interface INode extends INodeBase {
    body?: NodeBody;
    outerBody?: INode;
    symbol?: string;
    meta?: Record<string, unknown>;
    params?: ParameterNode[];
    args?: INode[];
    locals?: string[];
    nonlocals?: string[];
    condition?: INode;
}

export abstract class BasicMeta {
    [key: string]: unknown;
}

type Hollow = BasicMeta | undefined;

export class Node<TMeta extends BasicMeta | undefined = Hollow> implements INode {
    public constructor(public readonly name: Nodes, public readonly type: NodeType, public readonly body: NodeBody,
        public readonly outerBody: INode | Node | undefined, public readonly symbol: string | undefined, public readonly meta: TMeta) { }
}

export const StatmentWithBodyNode = (name: Nodes, body: NodeBody, outerBody: INode) =>
    new Node(name, NodeType.Statment, body, outerBody, undefined, undefined);

export const ExpressionWithBodyNode = (name: Nodes, body: NodeBody) =>
    new Node(name, NodeType.Expression, body, undefined, undefined, undefined);

export const ExpressionWithBodyAndOuterNode = (name: Nodes, body: NodeBody, outer: Node) =>
    new Node(name, NodeType.Expression, body, outer, undefined, undefined);

export const ExpressionWithBodyAndSymbolNode = (name: Nodes, body: NodeBody, symbol: string) =>
    new Node(name, NodeType.Expression, body, undefined, symbol, undefined);

export const PrefixlessSymbolNode = (symbol: string) =>
    new Node(Nodes.SymbolNoPrefix, NodeType.Expression, undefined, undefined, symbol, undefined);

export const SymbolNode = (symbol: string) =>
    new Node(Nodes.Symbol, NodeType.Expression, undefined, undefined, symbol, undefined);

export const RegularExpressionNode = (symbol: string) =>
    new Node(Nodes.RegularExpression, NodeType.Expression, undefined, undefined, symbol, undefined);

export const ConstantValueNode = (nodename: Nodes) =>
    new Node(nodename, NodeType.Expression, undefined, undefined, undefined, undefined);

export const StringNode = (symbol: string) =>
    new Node(Nodes.StringValue, NodeType.Expression, undefined, undefined, symbol, undefined);

export const NumberNode = (symbol: string) =>
    new Node(Nodes.NumberValue, NodeType.Expression, undefined, undefined, symbol, undefined);

export const SymbolShortcutNode = (symbol: string) =>
    new Node(Nodes.SymbolShortcut, NodeType.Expression, undefined, undefined, symbol, undefined);

export class NodeWithArgsMeta extends BasicMeta {
    constructor(public readonly args: Node[]) { super(); }
}

export const ExpressionWithBodyAndArgsNode = (name: Nodes, body: NodeBody, args: Node[]) =>
    new Node(name, NodeType.Expression, body, undefined, undefined, new NodeWithArgsMeta(args));

export class NodeWithConditionMeta extends BasicMeta {
    constructor(public readonly condition: Node) { super(); }
}

export const StatmentWithBodyAndConditionNode = (name: Nodes, body: NodeBody, condition: Node, outerBody: Node) =>
    new Node(name, NodeType.Statment, body, outerBody, undefined, new NodeWithConditionMeta(condition));

export class IfStatmentMeta extends BasicMeta {
    public readonly else: Node;
    constructor($else: Node, public readonly elseif: Node, public readonly condition: Node) {
        super();
        this.else = $else;
    }
}

export const IfStatmentNode = (body: NodeBody, outer: Node, condition: Node) =>
    new Node(Nodes.IfStatment, NodeType.Statment, body, outer, undefined, new IfStatmentMeta(undefined!, undefined!, condition) as Writable<IfStatmentMeta>);

export class TryStatmentMeta extends BasicMeta {
    public readonly else: Node[];
    public readonly catch: Node;
    public readonly finally: Node[];
    constructor($else: Node[], $catch: Node, $finally: Node[]) {
        super();
        this.else = $else;
        this.catch = $catch;
        this.finally = $finally;
    }
}

export const TryStatmentNode = (body: NodeBody, $else: Node[], $catch: Node, $finally: Node[], outerBody: Node) =>
    new Node(Nodes.TryStatment, NodeType.Statment, body, outerBody, undefined, new TryStatmentMeta($else, $catch, $finally) as Writable<TryStatmentMeta>);

export const ConstantNodeMap = new Map<string, Node>([
    ["arguments", ConstantValueNode(Nodes.ArgumentsObject)],
    ["false", ConstantValueNode(Nodes.FalseValue)],
    ["Infinity", ConstantValueNode(Nodes.InfinityValue)],
    ["NaN", ConstantValueNode(Nodes.NaNValue)],
    ["null", ConstantValueNode(Nodes.NullValue)],
    ["this", ConstantValueNode(Nodes.ThisObject)],
    ["true", ConstantValueNode(Nodes.TrueValue)],
    ["undefined", ConstantValueNode(Nodes.UndefinedValue)],
] as const);

export interface ClassProperty {
    name: INode;
    body: INode[];
}

export interface ClassMethod extends ClassProperty {
    decorators: INode[];
    params: ParameterNode[];
}

export interface ClassGetter extends ClassMethod {
    params: [];
}

export interface ClassSetter extends ClassMethod {
    params: [] | [ParameterNode & { kind: ParameterNodeKind.Normal; }];
}

export interface ClassConstructor {
    body: INode[];
    params: ParameterNode[];
    async: boolean;
    gen: boolean;
}

export interface ClassNodeProps {
    methods: ClassMethod[];
    getters: ClassGetter[];
    settets: ClassSetter[];
    props: { name: INode; value: INode; }[];
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
    constructor(public readonly filename: string, public readonly outer: INode, public readonly cache: boolean, public insideExpression = false) { };
    [key: string]: unknown;
}

export class ParameterNode {
    public readonly default?: INode;
    constructor(public name: string | INode, public readonly kind: ParameterNodeKind, default_: INode | undefined) {
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
