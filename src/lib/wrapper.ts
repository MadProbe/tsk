import type { KnownUsed } from "./parser.js";

const __async = `function __async(f,t,a){` +
    `return new p(r=>{` +
    `var g=__apply(f,t,a),n=g.next,` +
    `_=p=>{` +
    `var v=__call(n,g,p);` +
    `v.done?r(v.value):pr(v.value).then(_)` +
    `};` +
    `_();` +
    `})` +
    `}`;

const __nullish = `function n(v){return v===null||v===u}`;
const __contains = `function __contains(i,v){` + // i = iterable, v = value
    // _ = iterator, n = next method of _, t = temp variable
    `for(var _=i[Symbol.iterator](),n=_.next,t;!(t=__call(n,_)).done;)if((t=t.value)===v||v!==v&&t!==t)return!0;return!1}`;
const __throw = "function __throw(e){throw e}";

export function wrap(code: string, used: Readonly<KnownUsed>) {
    return `(function(p,u){const c=n.call,__bind=c.bind(n.bind),pr=__bind(p.resolve,p),__call=__bind(c,c),__apply=__bind(c,n.apply);` +
        `${ __nullish }${ __async }${ used.contains ? __contains : "" }${ used.throw ? __throw : "" }return ${ code }})(Promise)()`;
}