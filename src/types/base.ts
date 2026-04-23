import { DEFAULT_KEY, RequestMethod } from '@/constants';
import type { RequestorRegistry, ResponseRegistry } from './registry';
import type { Middleware } from './middleware';

export type DefaultRegistryKey = typeof DEFAULT_KEY;

// 请求配置,方法的入参
export interface RequestConfig<D = any> extends Record<string, any> {
    // 请求url
    url: string;
    // 请求方法
    method: RequestMethod;
    // 请求体
    data?: D;
}

// 去掉 method 和 url 的请求配置，用于扩展请求
export type WithoutMethod<D = any> = Omit<RequestConfig<D>, 'method' | 'url'>;

// 定义注入方法的类型
export type BaseRequestor<R = any, D = any> = (config: RequestConfig<D>) => Promise<R>;

type ResolveReturn<K extends keyof RequestorRegistry, R, D> = Promise<ResponseRegistry<R, D>[K]>;

export type RequestorHttpMethods<K extends keyof RequestorRegistry = keyof RequestorRegistry> = {
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => ResolveReturn<K, R, D>;
    post: <R = any, D = any>(
        url: string,
        data?: D,
        config?: WithoutMethod<D>,
    ) => ResolveReturn<K, R, D>;
    put: <R = any, D = any>(
        url: string,
        data?: D,
        config?: WithoutMethod<D>,
    ) => ResolveReturn<K, R, D>;
    delete: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => ResolveReturn<K, R, D>;
};

/**
 * Requestor：与注入/显式指定的请求器函数类型完全一致，再交叉四个 HTTP 方法
 * （运行时由 createRequestAdapter 把同一套 run 挂到该函数对象上）
 */
export type Requestor<K extends keyof RequestorRegistry = keyof RequestorRegistry> =
    RequestorRegistry[K] & RequestorHttpMethods<K>;

// 创建请求器配置
export interface CreateRequestorConfig<
    Extensions extends readonly Middleware[] = readonly Middleware[],
    K extends keyof RequestorRegistry = keyof RequestorRegistry,
> {
    extensions?: Extensions;
    instanceKey?: K;
}
