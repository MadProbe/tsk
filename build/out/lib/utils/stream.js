/**
 * @template {import("./stream").Streamable} T
 * @param {T} streamable
 * @returns {T}
 */
export function Stream(streamable) {
    var __index = 0;
    return {
        next: streamable[0],
        /**@param {any} [__next]*/
        move: function (__next) {
            __next = streamable[__index++];
            this.next = streamable[__index];
            return __next;
        },
        down: function () {
            return this.next = streamable[--__index];
        }
    };
}
