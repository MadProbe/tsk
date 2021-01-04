import { _echo } from "./_echo.js";
export const meberAccessOperators = [".", "?.", "!.", "![", "?.[", "["] as const;
export const end_expression = _echo("expression");
export const js_auto_variables = ["__external_var", "this", "arguments", "null", "NaN", "undefined", "Infinity", "true", "false"] as const;
export const keywords: readonly string[] = _echo("do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof|include|fn|async|await|undefined|not|contains|__external|__external_var|nonlocal|keep").split("|");
export const validChars = /^[$\w_][\d\w$_]*$/m;
export const $2charoperators = ["&&", "**", "||", "??", "==", "!=", "=>", "<=", ">=", "..", "+=", "/=", "&=", "-=", "++", "--", "*=", "|=", "//", ">>", "<<", "?.", "%=", "^=", "|>", "@@", "/*", "::", "!.", "!["] as const;
export const $3charoperators = ["?.[", "?.(", "??=", "||=", "&&=", "**=", ">>>", "...", ">>=", "<<=", "===", "!=="] as const;
