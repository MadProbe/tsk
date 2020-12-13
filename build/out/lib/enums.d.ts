/**
 * An enum containing all JavaScript & TSK grammatic
 * (and it's quite big lol)
 */
export declare const enum Nodes {
    FunctionExpression = 0,
    GeneratorFunctionExpression = 1,
    AsyncFunctionExpression = 2,
    AsyncGeneratorFunctionExpression = 3,
    ForStatment = 4,
    ThrowExpression = 5,
    GroupExpression = 6,
    AssignmentExpression = 7,
    AddictionAssignmentExpression = 8,
    SubstractionAssignmentExpression = 9,
    MultiplicationAssignmentExpression = 10,
    DivisionAssignmentExpression = 11,
    RemainderAssignmentExpression = 12,
    ExponentiationAssignmentExpression = 13,
    BitwiseANDAssignmentExpression = 14,
    BitwiseXORAssignmentExpression = 15,
    BitwiseORAssignmentExpression = 16,
    LogicalNullishCoalescingAssignmentExpression = 17,
    LogicalANDAssignmentExpression = 18,
    LogicalORAssignmentExpression = 19,
    DestructingAssignmentExpression = 20,
    BitwiseLeftShiftAssignmentExpression = 21,
    BitwiseRightShiftAssignmentExpression = 22,
    BitwiseUnsignedRightShiftAssignmentExpression = 23,
    AddictionExpression = 24,
    SubstractionExpression = 25,
    MultiplicationExpression = 26,
    DivisionExpression = 27,
    RemainderExpression = 28,
    ExponentiationExpression = 29,
    BitwiseANDExpression = 30,
    BitwiseNOTExpresssion = 31,
    BitwiseXORExpression = 32,
    BitwiseORExpression = 33,
    NullishCoalescingExpression = 34,
    LogicalANDExpression = 35,
    LogicalNOTExpresssion = 36,
    LogicalORExpression = 37,
    BitwiseLeftShiftExpression = 38,
    BitwiseRightShiftExpression = 39,
    BitwiseUnsignedRightShiftExpression = 40,
    CallExpression = 41,
    OptionalCallExpression = 42,
    MemberAccessExpression = 43,
    IfStatment = 44,
    TrueValue = 45,
    FalseValue = 46,
    NullValue = 47,
    UndefinedValue = 48,
    NaNValue = 49,
    InfinityValue = 50,
    NumberValue = 51,
    BigIntValue = 52,
    StringValue = 53,
    Symbol = 54,
    PipelineExpression = 55,
    PartialApplicationSyntax = 56,
    LiteralLogicalNotExpression = 57,
    ListComprehensionExpression = 58,
    IncludeStatment = 59,
    RangeValue = 60,
    InterfaceStatment = 61,
    TypeExpression = 62,
    TypeStatment = 63,
    ReturnStatment = 64,
    LooseComparison = 65,
    StrictComparison = 66,
    LessThanOrEqual = 67,
    GreaterThanOrEqual = 68,
    LessThan = 69,
    GreaterThan = 70,
    YieldExpression = 71,
    YieldFromExpression = 72,
    ExternalVariable = 73,
    AwaitExpression = 74,
    SymbolNoPrefix = 75,
    Empty = 76,
    Array = 77,
    ElseStatment = 78,
    ArgumentBindingExpression = 79,
    ArgumentsObject = 80,
    KeepStatment = 81,
    CodeBlock = 82,
    NewExpression = 83,
    ClassExpression = 84,
    NullAssertionExpression = 85
}
export declare const enum FNNodeType {
    Sync = 0,
    Generator = 1,
    Async = 2,
    AsyncGenerator = 3
}
export declare const enum ParameterNodeType {
    Normal = 0,
    Rest = 1,
    Empty = 2,
    NoPrefix = 3
}
/**
 * An enum describing type of each node (Statment | Expression)
 */
export declare const enum NodeType {
    Statment = 0,
    Expression = 1
}
export declare const enum Scopes {
    Sync = 0,
    Generator = 1,
    Async = 2,
    AsyncGenerator = 3
}
export declare const enum AccessChainItemKind {
    Head = 0,
    Normal = 1,
    Computed = 2,
    Optional = 3,
    OptionalComputed = 4,
    NormalNullAsserted = 5,
    ComputedNullAsserted = 6
}
export declare const enum Tokens {
    String = 0,
    Number = 1,
    Symbol = 2,
    Operator = 3,
    Special = 4,
    Regex = 5,
    Whitespace = 6,
    Comment = 7,
    Keyword = 8,
    Range = 9,
    MultilineComment = 10
}
export declare const enum DiagnosticSeverity {
    Info = 0,
    Warn = 1,
    RuntimeError = 2,
    Error = 3,
    FatalError = 4
}
