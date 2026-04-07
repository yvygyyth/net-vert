import { RequestMethod, type MiddlewareType } from '@/constants';

// 请求配置
export interface RequestConfig<D = any> extends Record<string, any> {
    // 请求url
    url: string;
    // 请求方法
    method: RequestMethod;
    // 请求体
    data?: D;
}

// 定义注入方法的类型
export type BaseRequestor<D = any, R = any> = (config: RequestConfig<D>) => Promise<R>;

export type WithoutMethod<D = any> = Omit<RequestConfig<D>, 'method' | 'url'>;

// Requestor 定义（所有方法都返回 Promise）
export interface Requestor {
    request: <R = any, D = any>(config: RequestConfig<D>) => Promise<R>;
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => Promise<R>;
    post: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => Promise<R>;
    put: <R = any, D = any>(url: string, data?: D, config?: WithoutMethod<D>) => Promise<R>;
    delete: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => Promise<R>;
}

// 获取入参类型
export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>;

// key类型
export type Key = string | symbol | number;

// 中间件上下文（共享的 this）
export interface MiddlewareContext extends Record<string, any> {}

// Middleware 类型：中间件都是异步的，返回 Promise
export type Middleware<D = any, R = any> = (context: {
    config: RequestConfig<D>;
    next: () => Promise<R>;
    ctx: MiddlewareContext;
}) => Promise<R>;

// 带类型标记的中间件
export type TypedMiddleware<Type extends MiddlewareType, D = any, R = any> = Middleware<D, R> & {
    __middlewareType: Type;
};

// 创建请求器配置
export interface CreateRequestorConfig<
    Extensions extends readonly Middleware[] = readonly Middleware[],
> {
    extensions?: Extensions;
    instanceKey?: Key;
}

// 导出工具类型
export * from './tool';
export * from './storage';
