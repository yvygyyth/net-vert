import type {
    DefaultRegistryKey,
    RequestConfig,
    Requestor,
    BaseRequestor,
    Middleware,
    MiddlewareContext,
    WithoutMethod,
    RequestorRegistry,
} from '@/types';
import { REQUEST_METHOD } from '@/constants';

export const methodConfigConverters = {
    [REQUEST_METHOD.GET]: <D = any>(url: string, config?: WithoutMethod<D>): RequestConfig<D> => ({
        url,
        method: REQUEST_METHOD.GET,
        ...config,
        params: config?.params,
    }),

    [REQUEST_METHOD.POST]: <D = any>(
        url: string,
        data?: D,
        config?: WithoutMethod<D>,
    ): RequestConfig<D> => ({
        url,
        method: REQUEST_METHOD.POST,
        data,
        ...config,
    }),

    [REQUEST_METHOD.DELETE]: <D = any>(
        url: string,
        config?: WithoutMethod<D>,
    ): RequestConfig<D> => ({
        url,
        method: REQUEST_METHOD.DELETE,
        ...config,
    }),

    [REQUEST_METHOD.PUT]: <D = any>(
        url: string,
        data?: D,
        config?: WithoutMethod<D>,
    ): RequestConfig<D> => ({
        url,
        method: REQUEST_METHOD.PUT,
        data,
        ...config,
    }),
} as const;

/**
 * 洋葱模型：按顺序执行中间件
 * @param config 请求配置
 * @param middlewares 中间件数组（所有中间件都是异步的）
 * @param requestor 基础请求器
 * @returns 返回 Promise
 */
function composeMiddlewares<R = any>(
    config: RequestConfig,
    middlewares: Middleware[],
    requestor: BaseRequestor,
): Promise<R> {
    // 创建共享的上下文对象（共享的 this）
    const ctx: MiddlewareContext = {};

    const dispatch = (index: number): Promise<R> => {
        if (index === middlewares.length) {
            // 最终执行时，使用 ctx.config（可能已被中间件修改）
            return requestor(config);
        }
        const middleware = middlewares[index];
        // 中间件执行，next 函数返回下一个中间件的结果
        return middleware({
            config,
            ctx,
            next: () => dispatch(index + 1),
        });
    };

    return dispatch(0);
}

export function createAdapter(
    requestor: BaseRequestor,
    middlewares?: readonly Middleware[],
): BaseRequestor {
    const mws = middlewares ?? [];
    return (config: RequestConfig) => composeMiddlewares(config, mws as Middleware[], requestor);
}

export function createRequestAdapter<K extends keyof RequestorRegistry = DefaultRegistryKey>(
    requestor: BaseRequestor,
    middlewares?: readonly Middleware[],
): Requestor<K> {
    const run = createAdapter(requestor, middlewares);
    const instance = run as Requestor<K>;

    instance.get = ((url, config) =>
        run(methodConfigConverters[REQUEST_METHOD.GET](url, config))) as Requestor<K>['get'];
    instance.post = ((url, data, config) =>
        run(
            methodConfigConverters[REQUEST_METHOD.POST](url, data, config),
        )) as Requestor<K>['post'];
    instance.delete = ((url, config) =>
        run(methodConfigConverters[REQUEST_METHOD.DELETE](url, config))) as Requestor<K>['delete'];
    instance.put = ((url, data, config) =>
        run(methodConfigConverters[REQUEST_METHOD.PUT](url, data, config))) as Requestor<K>['put'];

    return instance;
}
