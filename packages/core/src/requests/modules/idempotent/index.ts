import { createPromiseCache } from '@/requests/modules/idempotent/createPromiseCache'
import type { Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { IdempotencyContext, IdempotencyOptions, IdempotentMiddleware } from './type'

const hashRequest = (params: IdempotencyContext) => {
    const { config } = params
    const { method, url, data } = config
    const hash = [method, url, JSON.stringify(data)].join('|')
    return hash
}   

const defaultConfig: IdempotencyOptions = {
    key: hashRequest
}

export const idempotent = <D = any, R = any>(options?: Partial<IdempotencyOptions<D>>): IdempotentMiddleware<D, R> => {
    const idempotentConfig = { ...defaultConfig, ...options }
    // 缓存请求结果
    const promiseCache = createPromiseCache()
    
    const middleware:Middleware<false, D, R> = ({ config, next }) => {
        const key = idempotentConfig.key({ config })
        const existingPromise = promiseCache.getPromise<R>(key)
        if (existingPromise) {
            return existingPromise
        }
        const promise: Promise<R> = next()
        promiseCache.setPromise<R>(key, promise)
        return promise
    }
    
    // 添加中间件类型标记和 promiseCache 实例
    return Object.assign(middleware, { 
        __middlewareType: MIDDLEWARE_TYPE.IDEMPOTENT as const,
        promiseCache
    })
}