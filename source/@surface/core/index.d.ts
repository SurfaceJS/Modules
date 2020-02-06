// tslint:disable:interface-name
// tslint:disable:no-any

export interface Constructor<T = Object> extends Function
{
    readonly prototype: T;
    new (...args: Array<any>): T;
}

export type Action                                    = () => void;
export type Action1<T1>                               = (arg: T1) => void;
export type Action2<T1, T2>                           = (arg1: T1, arg2: T2) => void;
export type Action3<T1, T2, T3>                       = (arg1: T1, arg2: T2, arg3: T3) => void;
export type ClassDecoratorOf<T>                       = (target: Constructor<T>) => Constructor<T> | void;
export type Combine<T extends Array<object>>          = UnionToIntersection<ValuesOf<T>>;
export type DeepRequired<T>                           = { [K in keyof T]-?: T[K] extends T[K]|undefined ? DeepRequired<T[K]> : Required<T[K]> };
export type DeepPartial<T>                            = { [K in keyof T]?: T[K] extends T[K]|undefined ? DeepPartial<T[K]> : Partial<T[K]> };
export type FieldsOf<T>                               = { [K in keyof T]: T[K] };
export type Func1<T1, TResult>                        = (arg: T1) => TResult;
export type Func2<T1, T2, TResult>                    = (arg1: T1, arg2: T2) => TResult;
export type Func3<T1, T2, T3, TResult>                = (arg1: T1, arg2: T2, arg3: T3) => TResult;
export type Func<TResult>                             = () => TResult;
export type IgnoreKeysOfType<T extends object, U>     = { [K in keyof T]: T[K] extends U ? never : K }[keyof T];
export type IgnoreOfType<T extends object, U>         = { [K in IgnoreKeysOfType<T, U>]: T[K] };
export type Indexer<T = unknown>                      = object & { [key: string]: T|undefined; [key: number]: T|undefined; };
export type IndexesOf<T extends any[]>                = ValuesOf<{ [K in keyof T]: K }>;
export type KeysOfType<T extends object, U>           = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type KeyValue<T, K extends keyof T = keyof T>  = [K, T[K]];
export type Merge<T extends object, U extends object> = { [K in keyof (T & U)]: K extends keyof T ? T[K] : K extends keyof U ? U[K] : never };
export type MethodsOf<T extends object>               = KeysOfType<T, Function>;
export type Nullable<T = Object>                      = T|null|undefined;
export type OnlyOfType<T extends object, U>           = Pick<T, KeysOfType<T, U>>;
export type Overwrite<T, U>                           = { [K in Exclude<keyof T, U>]: K extends keyof U ? U[K] : T[K] };
export type Required<T>                               = { [K in keyof T]-?: NonNullable<T[K]> };
export type TypesOf<T>                                = T[keyof T];
export type UnionToIntersection<U>                    = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
export type ValuesOf<T extends any[]>                 = T[number];
