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
    NullAssertionExpression
}
export const enum FNNodeType {
    Sync,
    Generator,
    Async,
    AsyncGenerator
}
export const enum ParameterNodeType {
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
    Expression
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
    String,
    Number,
    Symbol,
    Operator,
    Special,
    Regex,
    Whitespace,
    Comment,
    Keyword,
    Range,
    MultilineComment
}
export const enum DiagnosticSeverity {
    Info,
    Warn,
    RuntimeError,
    Error,
    FatalError
}