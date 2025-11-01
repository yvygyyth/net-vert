import { createPromiseCache } from '@/requests/modules/idempotent/createPromiseCache'
import type { Middleware } from '@/types'
import type { IdempotencyContext, IdempotencyOptions } from './type'

const hashRequest = (params: IdempotencyContext) => {
    const { config } = params
    const { method, url, data } = config
    const hash = [method, url, JSON.stringify(data)].join('|')
    return hash
}   

const defaultConfig: IdempotencyOptions = {
    key: hashRequest as (params: IdempotencyContext) => string,
}

export const idempotent = (options?: Partial<IdempotencyOptions>): Middleware => {
    const idempotentConfig = { ...defaultConfig, ...options }
    // 缓存请求结果
    const cache = createPromiseCache()
    
    return ({ config, next }) => {
        const key = idempotentConfig.key({ config })
        const existingPromise = cache.getPromise(key)
        if (existingPromise) {
            return existingPromise
        }
        const promise = next()
        cache.setPromise(key, promise)
        return promise
    }
}