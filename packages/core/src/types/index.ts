import { RequestMethod, MIDDLEWARE_TYPE, type MiddlewareType } from '@/constants';

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

export type MaybePromise<IsSync, R> =
  IsSync extends true ? R :
  IsSync extends false ? Promise<R> :
  R | Promise<R>;

// Requestor 定义（IsSync 控制 Promise 与否）
export interface Requestor<IsSync extends boolean = false>{
    request: <R = any, D = any>(config: RequestConfig<D>) => MaybePromise<IsSync, R>;
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => MaybePromise<IsSync, R>;
    post: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => MaybePromise<IsSync, R>;
    put: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => MaybePromise<IsSync, R>;
    delete: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => MaybePromise<IsSync, R>;
}
  
// 获取入参类型
export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>

// key类型
export type Key = string | symbol | number;

// 中间件上下文（共享的 this）
export interface MiddlewareContext extends Record<string, any> {

}

// Middleware 泛型：IsSync 控制返回类型，D 控制请求体类型，R 控制返回值类型
export type Middleware<
    IsSync extends boolean = false,
    D = any,
    R = any
> = (context: {
    config: RequestConfig<D>;
    next: () => MaybePromise<IsSync, R>;
    ctx: MiddlewareContext;
}) => MaybePromise<IsSync, R>;

// 带类型标记的中间件
export type TypedMiddleware<
    Type extends MiddlewareType,
    IsSync extends boolean = false,
    D = any,
    R = any
> = Middleware<IsSync, D, R> & {
    __middlewareType: Type;
};

// 检测数组中是否包含 SyncMiddleware
export type HasSyncMiddleware<T extends readonly any[]> = 
    T extends readonly [infer First, ...infer Rest]
        ? First extends TypedMiddleware<typeof MIDDLEWARE_TYPE.SYNC, true, any, any>
            ? true
            : HasSyncMiddleware<Rest>
        : false;

// 创建请求器配置
export interface CreateRequestorConfig<
    Extensions extends readonly Middleware[] = readonly Middleware[]
> {
    extensions?: Extensions;
    instanceKey?: Key;
}

// 导出工具类型
export * from './tool'