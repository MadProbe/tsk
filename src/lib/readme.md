# A small overview for those who may want to dig into this compiler
 - [compiler.ts](./compiler.ts) - de facto the entry point to the compiler machinery, joins up the lexer, parser, emitter and code wrapper together.
 - [parser.ts](./parser.ts) - self-explanatory, important functions:
   1. parse - called by compileCode() function, entry to the parser machinery: resets random private variable counter, initialized parser's output object, diagnostics array, converts its result when any async operation occured.
   2. @internal main_parse - called by parse() function, loops through tokens from lexer and calls _parse() function.
   3. _parse - called by various other parser function when insideExpression meta flag must be disposed e.g. resulting expression can safely be also typeof statment without any wrapping.
   4. __parse - decides how the `next` token must be treated and then either parsers into nothing (undefined) if token must be treated as nothing or to a Node.
   5. @internal parse_operators - self-explanatory.
   <!-- TODO: add documentation for utilities -->
   - [parsers](./parsers) folder contains functions that parse certain expression(s).
     1. [keywords.ts](./parsers/keywords.ts) - Contains big ol' object with function for each supported keyword. (BIGGG WIP)
     2. [array-expression.ts](./parsers/array-expression.ts) - self-explanatory.
     3. [group-expression.ts](./parsers/group-expression.ts) - self-explanatory.
     4. [call-expression.ts](./parsers/call-expression.ts) - self-explanatory.
     5. [external-var.ts](./parsers/external-var.ts) - self-explanatory.
     6. [assignments.ts](./parsers/assignments.ts) - self-explanatory.
     7. [common-expressions.ts](./parsers/common-expressions.ts) - self-explanatory.
     8. [body-parser.ts](./parsers/body-parser.ts) - self-explanatory.
     9. [object-expression.ts](./parsers/object-expression.ts) - self-explanatory (WIP).
     10. [regexp.ts](./parsers/regexp.ts) - self-explanatory.
     11. [member-access.ts](./parsers/member-access.ts) - self-explanatory.
 - [enums.ts](./enums.ts) - es habt alle da const enums.
 - [nodes.ts](./nodes.ts) - contains definition of class and interface of a Node and functions, wrapping Node constructor for simplicity.
 - [predence.ts](./predence.ts) - defines predence for each (almost) node type.
 - [wrapper.ts](./wrapper.ts) - wraps emitted code into a IIFE with functions exported and appends nessecary.
 - [emitter.ts](./emitter.ts) - Emits AST into JS code.
   1. emit - called by compileCode() function, prepares stuff before emitting and optionally emits shebang into the output.
   2. @internal _emit - called by emit(), self and other functions, decides how to emit node basing on its type (`node.name`: `type Nodes`).
      - var __text - carries the emitted JS code.
      - declare - appends compiler variable into function scope.
      - emitChain - emits chain of AccesssItemChain array.
      - emitSlicedArguments - emits code for function arguments after rest parameter.
      - emitCallExpression - emits code for `Nodes.CallExpression` like nodes.
      - emit_body - emits code from `body` parameter with default of `node.body`.
      - simple_emit_body - emits curly braces and prepares indentation before call to `emit_body`.
      - sp - inserts optional whitespace if `pretty` compiler option is specified and equals to `true`.
      - nl - inserts optional newline if `pretty` compiler option is specified and equals to `true`.
      - ri - raises indentation by 4 spaces (`    `) if `pretty` compiler option is specified and equals to `true`.
      - li - lowers indentation by 4 spaces (`    `) if `pretty` compiler option is specified and equals to `true`.
      - is - inserts indentation into text (controlled by ri() and li() functions) if `pretty` compiler option is specified and equals to `true`.
   3. @internal isBlockNode - determines if node has body with curly braces `{}`.
   4. @internal isSimple - determines if node can be emitted without parenthesis `()`.
   5. @internal var __pretty - carries value of `pretty` compiler option for the sake of optimizations and simplicity.
