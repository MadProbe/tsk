export var CommonOperatorTable = {
    "+": 24 /* AddictionExpression */,
    "-": 25 /* SubstractionExpression */,
    "*": 26 /* MultiplicationExpression */,
    "/": 27 /* DivisionExpression */,
    "%": 28 /* RemainderExpression */,
    "**": 29 /* ExponentiationExpression */,
    "&": 30 /* BitwiseANDExpression */,
    "^": 32 /* BitwiseXORExpression */,
    "|": 33 /* BitwiseORExpression */,
    "??": 34 /* NullishCoalescingExpression */,
    "&&": 35 /* LogicalANDExpression */,
    "||": 37 /* LogicalORExpression */,
    // "!": Nodes.LogicalNOTExpresssion, // Leaving this uncommented may lead to fun bugs 
    // expression ! expression will be parsed without compilation errors LOL
    "<<": 38 /* BitwiseLeftShiftExpression */,
    ">>": 39 /* BitwiseRightShiftExpression */,
    ">>>": 40 /* BitwiseUnsignedRightShiftExpression */,
    "::": 79 /* ArgumentBindingExpression */,
    ">": 70 /* GreaterThan */,
    ">=": 68 /* GreaterThanOrEqual */,
    "<": 69 /* LessThan */,
    "<=": 67 /* LessThanOrEqual */,
    "==": 65 /* LooseComparison */,
    "===": 66 /* StrictComparison */
};
export var AssignmentOperatorTable = {
    "=": 7 /* AssignmentExpression */,
    "+=": 8 /* AddictionAssignmentExpression */,
    "-=": 9 /* SubstractionAssignmentExpression */,
    "*=": 10 /* MultiplicationAssignmentExpression */,
    "/=": 11 /* DivisionAssignmentExpression */,
    "%=": 12 /* RemainderAssignmentExpression */,
    "**=": 13 /* ExponentiationAssignmentExpression */,
    "&=": 14 /* BitwiseANDAssignmentExpression */,
    "^=": 15 /* BitwiseXORAssignmentExpression */,
    "|=": 16 /* BitwiseORAssignmentExpression */,
    "??=": 17 /* LogicalNullishCoalescingAssignmentExpression */,
    "&&=": 18 /* LogicalANDAssignmentExpression */,
    "||=": 19 /* LogicalORAssignmentExpression */,
    "<<=": 21 /* BitwiseLeftShiftAssignmentExpression */,
    ">>=": 22 /* BitwiseRightShiftAssignmentExpression */,
    ">>>=": 23 /* BitwiseUnsignedRightShiftAssignmentExpression */
};
