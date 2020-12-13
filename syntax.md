# TSK Programming language syntax:

``` ts
AddictionExpression:
	Expression + Expression

SubstractionExpression:
	Expression - Expression

MultiplicationExpression:
	Expression * Expression

DivisionExpression:
	Expression / Expression

RemainderExpression:
	Expression % Expression

ExponentiationExpression:
	Expression ** Expression

BitwiseANDExpression:
	Expression & Expression

BitwiseXORExpression:
	Expression ^ Expression

BitwiseORExpression:
	Expression | Expression

NullishCoalescingExpression:
	Expression ?? Expression

LogicalANDExpression:
	Expression && Expression

LogicalORExpression:
	Expression || Expression

BitwiseLeftShiftExpression:
	Expression << Expression

BitwiseRightShiftExpression:
	Expression >> Expression

BitwiseUnsignedRightShiftExpression:
	Expression >>> Expression

ArgumentBindingExpression:
	Expression :: Expression

GreaterThan:
	Expression > Expression

GreaterThanOrEqual:
	Expression >= Expression

LessThan:
	Expression < Expression

LessThanOrEqual:
	Expression <= Expression

LooseComparison:
	Expression == Expression

StrictComparison:
	Expression === Expression

AddictionAssignmentExpression:
	Expression += Expression

SubstractionAssignmentExpression:
	Expression -= Expression

MultiplicationAssignmentExpression:
	Expression *= Expression

DivisionAssignmentExpression:
	Expression /= Expression

RemainderAssignmentExpression:
	Expression %= Expression

ExponentiationAssignmentExpression:
	Expression **= Expression

BitwiseANDAssignmentExpression:
	Expression &= Expression

BitwiseXORAssignmentExpression:
	Expression ^= Expression

BitwiseORAssignmentExpression:
	Expression |= Expression

LogicalNullishCoalescingAssignmentExpression:
	Expression ??= Expression

LogicalANDAssignmentExpression:
	Expression &&= Expression

LogicalORAssignmentExpression:
	Expression ||= Expression

BitwiseLeftShiftAssignmentExpression:
	Expression <<= Expression

BitwiseRightShiftAssignmentExpression:
	Expression >>= Expression

BitwiseUnsignedRightShiftAssignmentExpression:
	Expression >>>= Expression

ExternalVariable:
	__external_var(String);

Symbol:
	// Note, letter is english alphabet letter, either uppercase or lowercase
	(letter or $ or _ and containg letters, numbers, $, _ and result must not be keyword), arguments, this, ExternalVariable

Expression:
	Symbol,
	Number,
	String,
	Statment,
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
	LogicalORExpression,
	BitwiseLeftShiftExpression,
	BitwiseRightShiftExpression,
	BitwiseUnsignedRightShiftExpression,
	ArgumentBindingExpression,
	GreaterThan,
	GreaterThanOrEqual,
	LessThan,
	LessThanOrEqual,
	LooseComparison,
	StrictComparison,
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
	BitwiseLeftShiftAssignmentExpression,
	BitwiseRightShiftAssignmentExpression,
	BitwiseUnsignedRightShiftAssignmentExpression

Statments:
	...Expression
```
