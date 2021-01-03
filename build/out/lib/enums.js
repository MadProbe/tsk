/**
 * An enum containing all JavaScript & TSK grammatic
 * (and it's quite big lol)
 */
export var Nodes;
(function (Nodes) {
    Nodes[Nodes["FunctionExpression"] = 0] = "FunctionExpression";
    Nodes[Nodes["GeneratorFunctionExpression"] = 1] = "GeneratorFunctionExpression";
    Nodes[Nodes["AsyncFunctionExpression"] = 2] = "AsyncFunctionExpression";
    Nodes[Nodes["AsyncGeneratorFunctionExpression"] = 3] = "AsyncGeneratorFunctionExpression";
    Nodes[Nodes["ForStatment"] = 4] = "ForStatment";
    // 'throw' is expression bcs it's will be transplied into expression
    Nodes[Nodes["ThrowExpression"] = 5] = "ThrowExpression";
    Nodes[Nodes["GroupExpression"] = 6] = "GroupExpression";
    Nodes[Nodes["AssignmentExpression"] = 7] = "AssignmentExpression";
    Nodes[Nodes["AddictionAssignmentExpression"] = 8] = "AddictionAssignmentExpression";
    Nodes[Nodes["SubstractionAssignmentExpression"] = 9] = "SubstractionAssignmentExpression";
    Nodes[Nodes["MultiplicationAssignmentExpression"] = 10] = "MultiplicationAssignmentExpression";
    Nodes[Nodes["DivisionAssignmentExpression"] = 11] = "DivisionAssignmentExpression";
    Nodes[Nodes["RemainderAssignmentExpression"] = 12] = "RemainderAssignmentExpression";
    Nodes[Nodes["ExponentiationAssignmentExpression"] = 13] = "ExponentiationAssignmentExpression";
    Nodes[Nodes["BitwiseANDAssignmentExpression"] = 14] = "BitwiseANDAssignmentExpression";
    Nodes[Nodes["BitwiseXORAssignmentExpression"] = 15] = "BitwiseXORAssignmentExpression";
    Nodes[Nodes["BitwiseORAssignmentExpression"] = 16] = "BitwiseORAssignmentExpression";
    Nodes[Nodes["LogicalNullishCoalescingAssignmentExpression"] = 17] = "LogicalNullishCoalescingAssignmentExpression";
    Nodes[Nodes["LogicalANDAssignmentExpression"] = 18] = "LogicalANDAssignmentExpression";
    Nodes[Nodes["LogicalORAssignmentExpression"] = 19] = "LogicalORAssignmentExpression";
    Nodes[Nodes["DestructingAssignmentExpression"] = 20] = "DestructingAssignmentExpression";
    Nodes[Nodes["BitwiseLeftShiftAssignmentExpression"] = 21] = "BitwiseLeftShiftAssignmentExpression";
    Nodes[Nodes["BitwiseRightShiftAssignmentExpression"] = 22] = "BitwiseRightShiftAssignmentExpression";
    Nodes[Nodes["BitwiseUnsignedRightShiftAssignmentExpression"] = 23] = "BitwiseUnsignedRightShiftAssignmentExpression";
    Nodes[Nodes["AddictionExpression"] = 24] = "AddictionExpression";
    Nodes[Nodes["SubstractionExpression"] = 25] = "SubstractionExpression";
    Nodes[Nodes["MultiplicationExpression"] = 26] = "MultiplicationExpression";
    Nodes[Nodes["DivisionExpression"] = 27] = "DivisionExpression";
    Nodes[Nodes["RemainderExpression"] = 28] = "RemainderExpression";
    Nodes[Nodes["ExponentiationExpression"] = 29] = "ExponentiationExpression";
    Nodes[Nodes["BitwiseANDExpression"] = 30] = "BitwiseANDExpression";
    Nodes[Nodes["BitwiseNOTExpresssion"] = 31] = "BitwiseNOTExpresssion";
    Nodes[Nodes["BitwiseXORExpression"] = 32] = "BitwiseXORExpression";
    Nodes[Nodes["BitwiseORExpression"] = 33] = "BitwiseORExpression";
    Nodes[Nodes["NullishCoalescingExpression"] = 34] = "NullishCoalescingExpression";
    Nodes[Nodes["LogicalANDExpression"] = 35] = "LogicalANDExpression";
    Nodes[Nodes["LogicalNOTExpresssion"] = 36] = "LogicalNOTExpresssion";
    Nodes[Nodes["LogicalORExpression"] = 37] = "LogicalORExpression";
    Nodes[Nodes["BitwiseLeftShiftExpression"] = 38] = "BitwiseLeftShiftExpression";
    Nodes[Nodes["BitwiseRightShiftExpression"] = 39] = "BitwiseRightShiftExpression";
    Nodes[Nodes["BitwiseUnsignedRightShiftExpression"] = 40] = "BitwiseUnsignedRightShiftExpression";
    Nodes[Nodes["CallExpression"] = 41] = "CallExpression";
    Nodes[Nodes["OptionalCallExpression"] = 42] = "OptionalCallExpression";
    Nodes[Nodes["MemberAccessExpression"] = 43] = "MemberAccessExpression";
    Nodes[Nodes["IfStatment"] = 44] = "IfStatment";
    Nodes[Nodes["TrueValue"] = 45] = "TrueValue";
    Nodes[Nodes["FalseValue"] = 46] = "FalseValue";
    Nodes[Nodes["NullValue"] = 47] = "NullValue";
    Nodes[Nodes["UndefinedValue"] = 48] = "UndefinedValue";
    Nodes[Nodes["NaNValue"] = 49] = "NaNValue";
    Nodes[Nodes["InfinityValue"] = 50] = "InfinityValue";
    Nodes[Nodes["NumberValue"] = 51] = "NumberValue";
    Nodes[Nodes["BigIntValue"] = 52] = "BigIntValue";
    Nodes[Nodes["StringValue"] = 53] = "StringValue";
    Nodes[Nodes["Symbol"] = 54] = "Symbol";
    // Polyfilled
    Nodes[Nodes["PipelineExpression"] = 55] = "PipelineExpression";
    Nodes[Nodes["PartialApplicationSyntax"] = 56] = "PartialApplicationSyntax";
    // ## TSK Extentions ##
    Nodes[Nodes["LiteralLogicalNotExpression"] = 57] = "LiteralLogicalNotExpression";
    Nodes[Nodes["ListComprehensionExpression"] = 58] = "ListComprehensionExpression";
    Nodes[Nodes["IncludeStatment"] = 59] = "IncludeStatment";
    Nodes[Nodes["RangeValue"] = 60] = "RangeValue";
    // May be used for TS
    Nodes[Nodes["InterfaceStatment"] = 61] = "InterfaceStatment";
    Nodes[Nodes["TypeExpression"] = 62] = "TypeExpression";
    Nodes[Nodes["TypeStatment"] = 63] = "TypeStatment";
    Nodes[Nodes["ReturnStatment"] = 64] = "ReturnStatment";
    Nodes[Nodes["LooseComparison"] = 65] = "LooseComparison";
    Nodes[Nodes["StrictComparison"] = 66] = "StrictComparison";
    Nodes[Nodes["LessThanOrEqual"] = 67] = "LessThanOrEqual";
    Nodes[Nodes["GreaterThanOrEqual"] = 68] = "GreaterThanOrEqual";
    Nodes[Nodes["LessThan"] = 69] = "LessThan";
    Nodes[Nodes["GreaterThan"] = 70] = "GreaterThan";
    Nodes[Nodes["YieldExpression"] = 71] = "YieldExpression";
    Nodes[Nodes["YieldFromExpression"] = 72] = "YieldFromExpression";
    Nodes[Nodes["ExternalVariable"] = 73] = "ExternalVariable";
    Nodes[Nodes["AwaitExpression"] = 74] = "AwaitExpression";
    Nodes[Nodes["SymbolNoPrefix"] = 75] = "SymbolNoPrefix";
    Nodes[Nodes["Empty"] = 76] = "Empty";
    Nodes[Nodes["Array"] = 77] = "Array";
    Nodes[Nodes["ElseStatment"] = 78] = "ElseStatment";
    Nodes[Nodes["ArgumentBindingExpression"] = 79] = "ArgumentBindingExpression";
    Nodes[Nodes["ArgumentsObject"] = 80] = "ArgumentsObject";
    Nodes[Nodes["KeepStatment"] = 81] = "KeepStatment";
    Nodes[Nodes["CodeBlock"] = 82] = "CodeBlock";
    Nodes[Nodes["NewExpression"] = 83] = "NewExpression";
    Nodes[Nodes["ClassExpression"] = 84] = "ClassExpression";
    Nodes[Nodes["NullAssertionExpression"] = 85] = "NullAssertionExpression";
})(Nodes || (Nodes = {}));
export var FNNodeType;
(function (FNNodeType) {
    FNNodeType[FNNodeType["Sync"] = 0] = "Sync";
    FNNodeType[FNNodeType["Generator"] = 1] = "Generator";
    FNNodeType[FNNodeType["Async"] = 2] = "Async";
    FNNodeType[FNNodeType["AsyncGenerator"] = 3] = "AsyncGenerator";
})(FNNodeType || (FNNodeType = {}));
export var ParameterNodeType;
(function (ParameterNodeType) {
    ParameterNodeType[ParameterNodeType["Normal"] = 0] = "Normal";
    ParameterNodeType[ParameterNodeType["Rest"] = 1] = "Rest";
    ParameterNodeType[ParameterNodeType["Empty"] = 2] = "Empty";
    ParameterNodeType[ParameterNodeType["NoPrefix"] = 3] = "NoPrefix";
})(ParameterNodeType || (ParameterNodeType = {}));
/**
 * An enum describing type of each node (Statment | Expression)
 */
export var NodeType;
(function (NodeType) {
    NodeType[NodeType["Statment"] = 0] = "Statment";
    NodeType[NodeType["Expression"] = 1] = "Expression";
})(NodeType || (NodeType = {}));
export var Scopes;
(function (Scopes) {
    Scopes[Scopes["Sync"] = 0] = "Sync";
    Scopes[Scopes["Generator"] = 1] = "Generator";
    Scopes[Scopes["Async"] = 2] = "Async";
    Scopes[Scopes["AsyncGenerator"] = 3] = "AsyncGenerator";
})(Scopes || (Scopes = {}));
export var AccessChainItemKind;
(function (AccessChainItemKind) {
    AccessChainItemKind[AccessChainItemKind["Head"] = 0] = "Head";
    AccessChainItemKind[AccessChainItemKind["Normal"] = 1] = "Normal";
    AccessChainItemKind[AccessChainItemKind["Computed"] = 2] = "Computed";
    AccessChainItemKind[AccessChainItemKind["Optional"] = 3] = "Optional";
    AccessChainItemKind[AccessChainItemKind["OptionalComputed"] = 4] = "OptionalComputed";
    AccessChainItemKind[AccessChainItemKind["NormalNullAsserted"] = 5] = "NormalNullAsserted";
    AccessChainItemKind[AccessChainItemKind["ComputedNullAsserted"] = 6] = "ComputedNullAsserted";
})(AccessChainItemKind || (AccessChainItemKind = {}));
export var Tokens;
(function (Tokens) {
    Tokens[Tokens["String"] = 0] = "String";
    Tokens[Tokens["Number"] = 1] = "Number";
    Tokens[Tokens["Symbol"] = 2] = "Symbol";
    Tokens[Tokens["Operator"] = 3] = "Operator";
    Tokens[Tokens["Special"] = 4] = "Special";
    Tokens[Tokens["Regex"] = 5] = "Regex";
    Tokens[Tokens["Whitespace"] = 6] = "Whitespace";
    Tokens[Tokens["Comment"] = 7] = "Comment";
    Tokens[Tokens["Keyword"] = 8] = "Keyword";
    Tokens[Tokens["Range"] = 9] = "Range";
    Tokens[Tokens["MultilineComment"] = 10] = "MultilineComment";
})(Tokens || (Tokens = {}));
export var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Info"] = 0] = "Info";
    DiagnosticSeverity[DiagnosticSeverity["Warn"] = 1] = "Warn";
    DiagnosticSeverity[DiagnosticSeverity["RuntimeError"] = 2] = "RuntimeError";
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 3] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["FatalError"] = 4] = "FatalError";
})(DiagnosticSeverity || (DiagnosticSeverity = {}));
