import { Nodes } from "../enums";


export type CommonOperatorTableKeys = keyof typeof CommonOperatorTable;
export type AssignmentOperatorTableKeys = keyof typeof AssignmentOperatorTable;
export const CommonOperatorTable = {
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
    "and": Nodes.LogicalANDExpression,
    "||": Nodes.LogicalORExpression,
    "or": Nodes.LogicalORExpression,
    "<<": Nodes.BitwiseLeftShiftExpression,
    ">>": Nodes.BitwiseRightShiftExpression,
    ">>>": Nodes.BitwiseUnsignedRightShiftExpression,
    "::": Nodes.ArgumentBindingExpression,
    ">": Nodes.GreaterThan,
    ">=": Nodes.GreaterThanOrEqual,
    "<": Nodes.LessThan,
    "<=": Nodes.LessThanOrEqual,
    "==": Nodes.LooseEquality,
    "===": Nodes.StrictEquality,
    "!=": Nodes.LooseInequality,
    "!==": Nodes.StrictInequality
} as const;
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
} as const;

