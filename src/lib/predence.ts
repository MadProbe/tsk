import { Nodes } from "./enums.js";
import { AssignmentOperatorTable } from "./utils/table.js";
import { frozen } from "./utils/util.js";

export const enum Predence {
    Null,
    Comma,
    AssignmentAndYield,
    Ternary,
    Coalescing,
    LiteralLogicalNot,
    LogicalOR,
    LogicalAND,
    Pipeline,
    BitwiseOR,
    BitwiseXOR,
    BitwiseAND,
    Equality,
    /** > >= < <= in instanceof contains */
    ThanAndIn,
    Shift,
    AddAndSub,
    RemDivAndMul,
    Expondentiation,
    Range,
    PrefixOps,
    PostfixIncAndDec,
    ArgumentlessNew,
    CallsAndMemberAccess,
    Grouping,
    Highest = 0xffffffff
}

export const PredenceMap: ReadonlyMap<Nodes, Predence> = new Map<Nodes, Predence>();

const object = frozen({
    [Predence.AssignmentAndYield]: [...Object.values(AssignmentOperatorTable), Nodes.YieldExpression, Nodes.YieldFromExpression],
    [Predence.Ternary]: [Nodes.TernaryExpression],
    [Predence.Coalescing]: [Nodes.NullishCoalescingExpression],
    [Predence.LiteralLogicalNot]: [Nodes.LiteralLogicalNotExpression],
    [Predence.LogicalOR]: [Nodes.LogicalORExpression],
    [Predence.LogicalAND]: [Nodes.LogicalANDExpression],
    [Predence.BitwiseOR]: [Nodes.BitwiseORExpression],
    [Predence.BitwiseXOR]: [Nodes.BitwiseXORExpression],
    [Predence.BitwiseAND]: [Nodes.BitwiseANDExpression],
    [Predence.Equality]: [Nodes.LooseEquality, Nodes.LooseInequality, Nodes.StrictEquality, Nodes.StrictInequality],
    [Predence.ThanAndIn]: [Nodes.GreaterThan, Nodes.GreaterThanOrEqual, Nodes.LessThan, Nodes.LessThanOrEqual, Nodes.InExpression, Nodes.InstanceOfExpression, Nodes.ContainsExpression],
    [Predence.Shift]: [Nodes.BitwiseLeftShiftExpression, Nodes.BitwiseRightShiftExpression, Nodes.BitwiseUnsignedRightShiftExpression],
    [Predence.AddAndSub]: [Nodes.AddictionExpression, Nodes.SubstractionExpression],
    [Predence.RemDivAndMul]: [Nodes.RemainderExpression, Nodes.DivisionExpression, Nodes.MultiplicationExpression],
    [Predence.Expondentiation]: [Nodes.ExponentiationExpression],
    [Predence.Range]: [Nodes.RangeExpression],
    [Predence.PrefixOps]: [Nodes.AwaitExpression, Nodes.VoidExpression, Nodes.DeleteExpression, Nodes.TypeOfExpression, Nodes.PrefixIncrementExpression, Nodes.PrefixDecrementExpression, Nodes.PlusExpression, Nodes.NegatationExpression, Nodes.BitwiseRevertExpression, Nodes.LogicalNOTExpresssion],
    [Predence.PostfixIncAndDec]: [Nodes.PostfixIncrementExpression, Nodes.PostfixDecrementExpression],
    [Predence.ArgumentlessNew]: [Nodes.NewExpression],
    [Predence.CallsAndMemberAccess]: [Nodes.MemberAccessExpression, Nodes.CallExpression, Nodes.ArgumentBindingExpression, Nodes.OptionalCallExpression]
} as unknown as Record<Predence, Nodes[]>);

for (const [predence, values] of Object.entries(object)) {
    for (const value of values) {
        (PredenceMap as Map<Nodes, Predence>).set(value, +predence);
    }
}
