import type { BaseRequestor } from './base';
// key类型（WrapHttpResponse / Requestor 会用到）
export type Key = string | symbol | number;

// 请求器注册表给外界扩展用
export interface RequestorRegistry {
    [key: Key]: BaseRequestor<Key>;
}

declare const __responseRegistryBrand: Key;

/**
 * 给外部通过模块扩展注入响应类型映射用。
 * 这里保留 R/D 泛型入口，同时通过内部 brand 字段显式使用它们，
 * 避免 TS6205（类型参数未使用）报错。
 */
export interface ResponseRegistry<R = any, D = any> {
    [__responseRegistryBrand]?: { response: R; data: D };
}
