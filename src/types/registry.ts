import type { BaseRequestor } from './base';
// key类型（WrapHttpResponse / Requestor 会用到）
export type Key = string | symbol | number;

// 请求器注册表给外界扩展用
export interface RequestorRegistry {
    [key: Key]: BaseRequestor<any, any>;
}

export interface ResponseRegistry<R = any, D = any> {
    [key: Key]: R;
}
