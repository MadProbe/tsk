import { Prototypeless } from "./util.js";
import type { Tokens } from "../enums";
import type { Prefix } from "./advancers.js";


export interface TextStream {
    readonly text: string;
    index: number;
    next: string;
    move(): string;
    advance(): string;
    down(times: number): string;
}
export interface TokenStream {
    readonly next: Token;
    move(): Token;
    advance(): Token;
    try<P extends string>(end: string, prefix?: Prefix<P>): Token;
    confirm_try(): void;
    cancel_try(): void;
    readonly text_stream: TextStream;
    [Symbol.iterator](): Generator<Token>;
};
@Prototypeless
export class Token {
    constructor(public readonly type: Tokens, public readonly body: string) { }
    is(type: Tokens, body: string) {
        return (this.type & type) !== 0 && this.body === body;
    }
}
/**@deprecated */
export type TokenList = readonly Token[];


@Prototypeless
export class Stream implements TextStream {
    public index: number = 0;
    public next: string;
    constructor(public readonly text: string) {
        this.next = text[0];
    }
    advance() {
        return this.next = this.text[++this.index];
    }
    move() {
        const __next = this.text[this.index];
        this.next = this.text[++this.index];
        return __next!;
    }
    down(times: number) {
        return this.next = this.text[this.index -= times];
    }
}
