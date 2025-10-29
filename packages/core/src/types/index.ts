import { RequestMethod } from '@/constants';

// 请求配置
export interface RequestConfig<D = any> extends Record<string, any> {
    // 请求url
    url: string
    // 请求方法
    method: RequestMethod
    // 请求体
    data?: D,
}

// 定义注入方法的类型
export type BaseRequestor = (
    config: RequestConfig<any>
) => any;
  

export type WithoutMethod<D = any> = Omit<RequestConfig<D>, 'method' | 'url'>

// export type MaybePromise<IsSync extends boolean, R> = IsSync extends true ? R : Promise<R>;

// Requestor 定义（IsSync 控制 Promise 与否）
export interface Requestor{
    request: <R = any, D = any>(config: RequestConfig<D>) => R;
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => R;
    post: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => R;
    put: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => R;
    delete: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => R;
}
  
// 获取入参类型
export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>

// key类型
export type Key = string | symbol | number;


// Middleware 泛型：IsSync 控制返回类型，D 控制请求体类型，R 控制返回值类型
export type Middleware<
    D = any,
    R = any
> = (context: {
    config: RequestConfig<D>;
    next: () => R;
}) => R;

// 创建请求器配置
export interface CreateRequestorConfig {
    extensions?: Middleware<any, any>[];
    instanceKey?: Key;
}