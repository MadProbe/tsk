/**
 * An enum containing all JavaScript & TSK grammatic
 * (and it's quite big lol)
 */
export const enum Nodes {
    FunctionExpression,
    GeneratorFunctionExpression,
    AsyncFunctionExpression,
    AsyncGeneratorFunctionExpression,
    ForStatment,
    // 'throw' is expression bcs it's will be transplied into expression
    ThrowExpression,
    GroupExpression,
    AssignmentExpression,
    AddictionAssignmentExpression,
    SubstractionAssignmentExpression,
    MultiplicationAssignmentExpression,
    DivisionAssignmentExpression,
    RemainderAssignmentExpression,
    ExponentiationAssignmentExpression,
    BitwiseANDAssignmentExpression,
    BitwiseXORAssignmentExpression,
    BitwiseORAssignmentExpression,
    LogicalNullishCoalescingAssignmentExpression,
    LogicalANDAssignmentExpression,
    LogicalORAssignmentExpression,
    DestructingAssignmentExpression,
    BitwiseLeftShiftAssignmentExpression,
    BitwiseRightShiftAssignmentExpression,
    BitwiseUnsignedRightShiftAssignmentExpression,
    AddictionExpression,
    SubstractionExpression,
    MultiplicationExpression,
    DivisionExpression,
    RemainderExpression,
    ExponentiationExpression,
    BitwiseANDExpression,
    BitwiseNOTExpresssion,
    BitwiseXORExpression,
    BitwiseORExpression,
    NullishCoalescingExpression,
    LogicalANDExpression,
    LogicalNOTExpresssion,
    LogicalORExpression,
    BitwiseLeftShiftExpression,
    BitwiseRightShiftExpression,
    BitwiseUnsignedRightShiftExpression,
    CallExpression,
    OptionalCallExpression,
    MemberAccessExpression,
    IfStatment,
    TrueValue,
    FalseValue,
    NullValue,
    UndefinedValue,
    NaNValue,
    InfinityValue,
    NumberValue,
    BigIntValue,
    StringValue,
    Symbol,
    // Polyfilled
    PipelineExpression,
    PartialApplicationSyntax,
    // ## TSK Extentions ##
    LiteralLogicalNotExpression,
    ListComprehensionExpression,
    IncludeStatment,
    RangeValue,
    // May be used for TS
    InterfaceStatment,
    TypeExpression,
    TypeStatment,
    ReturnStatment,
    LooseComparison,
    StrictComparison,
    LessThanOrEqual,
    GreaterThanOrEqual,
    LessThan,
    GreaterThan,
    YieldExpression,
    YieldFromExpression,
    ExternalVariable,
    AwaitExpression,
    SymbolNoPrefix,
    Empty,
    Array,
    ElseStatment,
    ArgumentBindingExpression,
    ArgumentsObject,
    KeepStatment,
    CodeBlock,
    NewExpression,
    ClassExpression,
    NullAssertionExpression,
    TryStatment,
    WhileStatment,
    DoWhileStatment,
    LooseNegativeComparison,
    StrictNegativeComparison,
    ImportExpression,
    NamedIncludeStatment,
    SymbolShortcut,
    ObjectExpression,
    Decorator,
    ForRangeStatment,
    ForOfStatment,
    RegularExpression,
    Shebang
}
export const enum FunctionNodeKind {
    Sync,
    Generator,
    Async,
    AsyncGenerator
}
export const enum ParameterNodeKind {
    Normal,
    Rest,
    Empty,
    NoPrefix
}
/**
 * An enum describing type of each node (Statment | Expression)
 */
export const enum NodeType {
    Statment,
    Expression,
    Ephemerial
}
export const enum Scopes {
    Sync,
    Generator,
    Async,
    AsyncGenerator
}
export const enum AccessChainItemKind {
    Head,
    Normal,
    Computed,
    Optional,
    OptionalComputed,
    NormalNullAsserted,
    ComputedNullAsserted
}
export const enum Tokens {
    String = 0x0000001,
    Number = 0x0000002,
    Symbol = 0x0000004,
    Operator = 0x00000008,
    Whitespace = 0x00000010,
    Comment = 0x00000020,
    MultilineComment = 0x00000040,
    Keyword = 0x00000080,
    Range = 0x00000100
}
export const enum DiagnosticSeverity {
    Info,
    Warn,
    RuntimeError,
    Error,
    FatalError
}
export const enum ParseNodeKind {
    Expression = "expression",
    String = "string",
    Number = "number",
    Range = "range",
    Indentifier = "indentifier"
}
export const enum ObjectBodyNodeKind {
    Normal,
    Setter,
    Getter,
    Rest
}