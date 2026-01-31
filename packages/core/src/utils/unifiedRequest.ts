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
 * @param middlewares 中间件数组（所有中间件都是异步的）
 * @param requestor 基础请求器
 * @returns 返回 Promise
 */
function composeMiddlewares<R = any>(
    config: RequestConfig,
    middlewares: Middleware[],
    requestor: BaseRequestor
): Promise<R> {
    // 创建共享的上下文对象（共享的 this）
    const ctx: MiddlewareContext = {}

    const dispatch = (index: number): Promise<R> => {
        if (index === middlewares.length) {
            // 最终执行时，使用 ctx.config（可能已被中间件修改）
            return requestor(config)
        }
        const middleware = middlewares[index]
        // 中间件执行，next 函数返回下一个中间件的结果
        return middleware({
            config,
            ctx,
            next: (() => dispatch(index + 1)),
        })
    }

    return dispatch(0)
}

export function createRequestAdapter(
    requestor: BaseRequestor,
    middlewares?: readonly Middleware[]
): Requestor {
    const methods = {} as Requestor
    const mws = middlewares ?? []

    methodKeys.forEach(
        <K extends keyof Requestor>(method: K) => {
            methods[method] = ((...args: HandlerParams<K>) => {
                const normalizedConfig = methodConfigConverters[method](...args)
                return composeMiddlewares(
                    normalizedConfig,
                    mws as Middleware[],
                    requestor
                )
            }) as Requestor[K]
        }
    )

    return methods
}
