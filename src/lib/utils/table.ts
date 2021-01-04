import { Nodes } from "../enums";

export type CommonOperatorTableType = typeof CommonOperatorTable;
export type CommonOperatorTableKeys = keyof CommonOperatorTableType;
export type AssignmentOperatorTableType = typeof AssignmentOperatorTable;
export type AssignmentOperatorTableKeys = keyof AssignmentOperatorTableType;
export var CommonOperatorTable = {
    "+": Nodes.AddictionExpression,
    "-": Nodes.SubstractionExpression,
    "*": Nodes.MultiplicationExpression,
    "/": Nodes.DivisionExpression,
    "%": Nodes.RemainderExpression,
    "**": Nodes.ExponentiationExpression,
    "&": Nodes.BitwiseANDExpression,
    "^": Nodes.BitwiseXORExpression,
    "|": Nodes.BitwiseORExpression,
    "??": Nodes.NullishCoalescingExpression,
    "&&": Nodes.LogicalANDExpression,
    "||": Nodes.LogicalORExpression,
    // "!": Nodes.LogicalNOTExpresssion, // Leaving this uncommented may lead to fun bugs 
    // expression ! expression will be parsed without compilation errors LOL
    "<<": Nodes.BitwiseLeftShiftExpression,
    ">>": Nodes.BitwiseRightShiftExpression,
    ">>>": Nodes.BitwiseUnsignedRightShiftExpression,
    "::": Nodes.ArgumentBindingExpression,
    ">": Nodes.GreaterThan,
    ">=": Nodes.GreaterThanOrEqual,
    "<": Nodes.LessThan,
    "<=": Nodes.LessThanOrEqual,
    "==": Nodes.LooseComparison,
    "===": Nodes.StrictComparison
}
export var AssignmentOperatorTable = {
    "=": Nodes.AssignmentExpression,
    "+=": Nodes.AddictionAssignmentExpression,
    "-=": Nodes.SubstractionAssignmentExpression,
    "*=": Nodes.MultiplicationAssignmentExpression,
    "/=": Nodes.DivisionAssignmentExpression,
    "%=": Nodes.RemainderAssignmentExpression,
    "**=": Nodes.ExponentiationAssignmentExpression,
    "&=": Nodes.BitwiseANDAssignmentExpression,
    "^=": Nodes.BitwiseXORAssignmentExpression,
    "|=": Nodes.BitwiseORAssignmentExpression,
    "??=": Nodes.LogicalNullishCoalescingAssignmentExpression,
    "&&=": Nodes.LogicalANDAssignmentExpression,
    "||=": Nodes.LogicalORAssignmentExpression,
    "<<=": Nodes.BitwiseLeftShiftAssignmentExpression,
    ">>=": Nodes.BitwiseRightShiftAssignmentExpression,
    ">>>=": Nodes.BitwiseUnsignedRightShiftAssignmentExpression
}

