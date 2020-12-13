export declare type CallFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T>) => ReturnType<T>;
export declare type ApplyFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, args: Parameters<T> | IArguments) => ReturnType<T>;
export declare type BindFunctionType = <T extends (...args: any[]) => void>(func: T, thisArg: ThisParameterType<T> | undefined, ...args: Parameters<T> | undefined[]) => T;
export declare var bind: BindFunctionType;
export declare var call: CallFunctionType;
export declare var apply: ApplyFunctionType;
declare type ArrayValueType<T extends any[] | readonly any[]> = {
    [key in Exclude<keyof T, keyof []>]: T[key];
} extends {
    [key: string]: infer V;
} ? V : never;
export declare function includes<A extends any[] | readonly any[]>(array: A, value: unknown): value is any[] extends A ? boolean : ArrayValueType<A>;
export declare function nullish(arg: unknown): arg is null | undefined;
/**
 * Another trick related to compression by babel
 */
export declare function _echo<T>(value: T): T;
export declare var undefined: undefined;
export declare function randomVarName(): string;
export declare function resetCounter(): void;
export declare function assert<T>(value: unknown): asserts value is T;
export declare function log_errors(errors: any[]): void;
export declare var isArray: <T>(arg: any) => arg is T[];
export declare function include(path: URL, cache?: boolean): string | Promise<string>;
export declare function inspectLog(shit: any): void;
declare var _SyntaxError: SyntaxErrorConstructor;
export { _SyntaxError as SyntaxError };
