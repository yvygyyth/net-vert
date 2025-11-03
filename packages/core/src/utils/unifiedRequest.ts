import type { RequestConfig, Requestor, BaseRequestor, HandlerParams, Middleware, MiddlewareContext, MaybePromise } from '@/types'
import { REQUEST_METHOD } from '@/constants'


export const methodConfigConverters: {
    [K in keyof Requestor<boolean>]: (...args: HandlerParams<K>) => RequestConfig
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

const methodKeys = Object.keys(methodConfigConverters) as Array<keyof Requestor<boolean>>

/**
 * 洋葱模型：按顺序执行中间件
 * @param config 请求配置
 * @param middlewares 中间件数组（支持同步和异步中间件）
 * @param requestor 基础请求器
 * @returns 根据 IsSync 返回同步或异步结果
 */
function composeMiddlewares<IsSync extends boolean = false, R = any>(
    config: RequestConfig,
    middlewares: Middleware<any, any, any>[],
    requestor: BaseRequestor
): MaybePromise<IsSync, R> {
    // 创建共享的上下文对象（共享的 this）
    const ctx: MiddlewareContext = {}

    const dispatch = (index: number): MaybePromise<IsSync, R> => {
        if (index === middlewares.length) {
            // 最终执行时，使用 ctx.config（可能已被中间件修改）
            return requestor(config) as MaybePromise<IsSync, R>
        }
        const middleware = middlewares[index]
        // 中间件执行，next 函数返回下一个中间件的结果
        // 类型断言是必要的，因为 TypeScript 无法在编译时确定中间件的同步/异步特性
        return middleware({
            config,
            ctx,
            next: (() => dispatch(index + 1)),
        }) as MaybePromise<IsSync, R>
    }

    return dispatch(0)
}

export function createRequestAdapter<IsSync extends boolean = false>(
    requestor: BaseRequestor,
    middlewares?: readonly Middleware[]
): Requestor<IsSync> {
    const methods = {} as Requestor<IsSync>
    const mws = middlewares ?? []

    methodKeys.forEach(
        <K extends keyof Requestor<IsSync>>(method: K) => {
            methods[method] = ((...args: HandlerParams<K>) => {
                const normalizedConfig = methodConfigConverters[method](...args)
                return composeMiddlewares<IsSync>(
                    normalizedConfig, 
                    mws as Middleware<any, any, any>[], 
                    requestor
                )
            }) as Requestor<IsSync>[K]
        }
    )

    return methods
}