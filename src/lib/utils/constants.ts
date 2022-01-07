import { _echo } from "./_echo.js";


export const memberAccessOperators = [".", "?.", "!.", "!.[", "?.[", "["] as const;
export const end_expression = "expression";
export const js_auto_variables = ["__external_var", "this", "arguments", "null", "NaN", "undefined", "Infinity", "true", "false"] as const;
export const keywords = ["do", "fn", "if", "in", "or", "and", "for", "new", "not", "try", "case", "else", "enum", "eval", "keep", "null", "this", "true", "void", "with", "async", "await", "break", "catch", "class", "const", "false", "macro", "super", "throw", "using", "while", "delete", "yield", "export", "extern", "import", "public", "return", "static", "switch", "typeof", "default", "extends", "finally", "include", "package", "private", "continue", "contains", "debugger", "arguments", "nonlocal", "interface", "__external", "protected", "implements", "instanceof", "undefined", "__external_var"] as const;
export const validChars = (function () {
    try {
        return Function("return/(?!\\d)[$_\\u200C\\u200D\\p{ID_Continue}]+/yu")() as RegExp;
    } catch {
        return /[$\w_][\d\w$_]*/y;
    }
})();
export const $2charoperators = ["&&", "**", "||", "??", "==", "!=", "=>", "<=", ">=", "..", "+=", "/=", "&=", "-=", "++", "--", "*=", "|=", "//", ">>", "<<", "?.", "%=", "^=", "|>", "@@", "/*", "::", "!.", "##"] as const;
export const $3charoperators = ["!.[", "?.[", "?.(", "??=", "||=", "&&=", "**=", ">>>", "...", ">>=", "<<=", "===", "!==", "##[", "##{", "##<"] as const;
export { end_expression as expression };
