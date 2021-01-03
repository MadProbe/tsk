var __async = "function __async(f,t,a){" +
    "return new p(function(r){" +
    "var g=__apply(f,t,a),n=g.next;" +
    "_();" +
    "function _(p){" +
    "var v=__call(n,g,p);" +
    "v.done?r(v.value):pr(v.value).then(function(v){_(v)})" +
    "}" +
    "})" +
    "}";
var __null_assert = "function __na(v){if(n(v))throw TypeError(\"Null assertion\");return v}";
var __nullish = "function n(v){return v===null||v===void 0}";
var __contains = "function __contains(i,v){" + // i = iterable, v = value
    // _ = iterator, n = next method of _, t = temp variable
    "for(var _=i[Symbol.iterator](),n=__bind(_.next,_),t;!(t=n()).done;)if((t=t.value)===v||v!==v&&j!==t)return!0;" +
    "return!1}";
export function wrap(code, used) {
    return "(function(){var _=function(){},p=Promise,c=_.call,__bind=c.bind(_.bind)," +
        "pr=__bind(p.resolve,p),__call=__bind(c,c),__apply=__bind(c,_.apply);" +
        (__nullish + ";" + __async + ";" + (used.contains ? __contains + ";" : "") + (used.na ? __null_assert + ";" : "")) +
        ("return(" + code + ")()})()");
}
