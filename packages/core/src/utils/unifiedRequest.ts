import type { RequestConfig, Requestor, BaseRequestor, HandlerParams, Middleware, MiddlewareContext } from '@/types'
import { REQUEST_METHOD } from '@/constants'


export const methodConfigConverters: {
    [K in keyof Requestor]: (...args: HandlerParams<K>) => RequestConfig
} = {
    get: (url, config) => ({
        url,
        method: REQUEST_METHOD.GET,
        ...config,
        params: config?.params
    }),

    post: (url, data, config) => ({
        url,
        method: REQUEST_METHOD.POST,
        data,
        ...config
    }),

    delete: (url, config) => ({
        url,
        method: REQUEST_METHOD.DELETE,
        ...config
    }),

    put: (url, data, config) => ({
        url,
        method: REQUEST_METHOD.PUT,
        data,
        ...config
    }),

    request: (config) => config
} as const

const methodKeys = Object.keys(methodConfigConverters) as Array<keyof Requestor>

/**
 * 洋葱模型：按顺序执行中间件
 * @param config 请求配置
 * @param middlewares 中间件数组
 * @param requestor 基础请求器
 */
function composeMiddlewares(
    config: RequestConfig,
    middlewares: Middleware[],
    requestor: BaseRequestor
) {
    // 创建共享的上下文对象（共享的 this）
    const ctx: MiddlewareContext = {}

    const dispatch = (index: number): Requestor[keyof Requestor] => {
        if (index === middlewares.length) {
            // 最终执行时，使用 ctx.config（可能已被中间件修改）
            return requestor(ctx.config)
        }
        const middleware = middlewares[index]
        return middleware({
            config,
            ctx,
            next: () => dispatch(index + 1),
        })
    }

    return dispatch(0)
}

export function createRequestAdapter(
    requestor: BaseRequestor,
    middlewares: Middleware[] = []
): Requestor {
    const methods = {} as Requestor

    methodKeys.forEach(
        <K extends keyof Requestor>(method: K) => {
            methods[method] = ((...args: HandlerParams<K>) => {
                const normalizedConfig = methodConfigConverters[method](...args)
                return composeMiddlewares(normalizedConfig, middlewares, requestor)
            }) as Requestor[K]
        }
    )

    return methods
}