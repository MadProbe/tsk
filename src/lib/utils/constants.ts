import { _echo } from "./_echo.js";
export const meberAccessOperators = [".", "?.", "!.", "![", "?.[", "["] as const;
export const end_expression = _echo("expression");
export const js_auto_variables = ["__external_var", "this", "arguments", "null", "NaN", "undefined", "Infinity", "true", "false"] as const;
export const keywords: readonly string[] = _echo("do|if|in|for|new|try|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|arguments|interface|protected|implements|instanceof|include|fn|async|await|undefined|not|contains|__external|__external_var|nonlocal|keep|using").split("|");
export const validChars = (function () {
    try {
        return Function("return/^[$_\\u200C\\u200D\\p{ID_Continue}]+$/u")() as RegExp;
    } catch {
        return /^[$\w_][\d\w$_]*$/m;
    }
})();
export const $2charoperators = ["&&", "**", "||", "??", "==", "!=", "=>", "<=", ">=", "..", "+=", "/=", "&=", "-=", "++", "--", "*=", "|=", "//", ">>", "<<", "?.", "%=", "^=", "|>", "@@", "/*", "::", "!.", "!["] as const;
export const $3charoperators = ["?.[", "?.(", "??=", "||=", "&&=", "**=", ">>>", "...", ">>=", "<<=", "===", "!=="] as const;
export { end_expression as expression };
