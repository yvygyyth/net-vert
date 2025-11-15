import type { TypedMiddleware, Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { SyncOptions, SyncContext } from './type'
import type { CacheUpdateContext } from '../cache/type'
import { CacheStorageFactory } from './ExpirableCacheStorage'
import { STORAGE_KEYS } from 'store-vert'

const createKey = (params: SyncContext) => {
    const { config } = params
    const { method, url } = config
    const hash = [method, url].join('|')
    return hash
}   

const defaultConfig: SyncOptions = {
    suspense: true,
    key: createKey,
    duration: 24 * 60 * 60 * 1000,
    isValid: () => true,
    store: STORAGE_KEYS.memory,
}

/**
 * 缓存中有数据则直接返回。
 * suspense 为 true 时，会抛出一个 Promise（而不是普通错误），Promise resolve 后得到数据。
 * suspense 为 false 时，会返回一个 Promise，Promise resolve 后得到数据，调用者需要用 await 或 .then 捕获。
 */

export function sync<D = any, R = any>(
    options: Partial<SyncOptions<D>> & { suspense: true }
): TypedMiddleware<MIDDLEWARE_TYPE.SYNC, true, D, R>

// 函数重载：suspense 为 false 时，返回异步中间件
export function sync<D = any, R = any>(
    options: Partial<SyncOptions<D>> & { suspense: false }
): TypedMiddleware<MIDDLEWARE_TYPE.SYNC, any, D, R>

// 函数重载：suspense 未指定时，默认为 true（同步中间件）
export function sync<D = any, R = any>(
    options?: Partial<SyncOptions<D>>
): TypedMiddleware<MIDDLEWARE_TYPE.SYNC, true, D, R>

// 实现
export function sync<D = any, R = any>(options?: Partial<SyncOptions<D>>): any {
    const syncConfig = { ...defaultConfig, ...options }
    // 根据 persist 选项创建存储实例
    const cacheStorage = new CacheStorageFactory<R>(syncConfig.store)

    const getDuration = (ctx: CacheUpdateContext<D, R>) => {
        return typeof syncConfig.duration === 'function'
            ? syncConfig.duration(ctx)
            : syncConfig.duration
    }
    
    const middleware: Middleware<boolean, D, R> = ({ config, next }) => {
        // 1. 生成缓存 key
        const key = syncConfig.key({ config })

        // 2. 检查缓存是否存在
        const cachedData = cacheStorage.getCache(key)
        if (cachedData) {
            // 3. 执行自定义有效性校验
            const isValid = syncConfig.isValid({
                key,
                config,
                cachedData,
            })
            
            if (isValid) return cachedData
            
            // 缓存过期或无效，清理旧缓存
            cacheStorage.removeItem(key)
        }
        

        if (syncConfig.suspense) {
            // suspense 模式：抛出 Promise，调用者需要用 Suspense 或 try/catch 捕获
            const p = syncConfig.wrapSuspense ? syncConfig.wrapSuspense({ key, config, p: next() as Promise<R>}) : (next() as Promise<R>)
            throw p.then((data: R) => {
                const duration = getDuration({ key, config, cachedData, response: data })
                cacheStorage.setCache(key, data, duration)
                return data
            })
        }

        // 非 suspense 模式：返回 Promise
        return (next() as Promise<R>).then((data: R) => {
            const duration = getDuration({ key, config, cachedData, response: data })
            cacheStorage.setCache(key, data, duration)
            return data
        })
    }
    
    // 添加中间件类型标记
    return Object.assign(middleware, { __middlewareType: MIDDLEWARE_TYPE.SYNC as const })
}