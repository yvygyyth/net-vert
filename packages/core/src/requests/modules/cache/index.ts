import type { Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import { CacheStorageFactory } from '@/requests/modules/cache/ExpirableCacheStorage'
import { createExpirableValue } from '@/utils/expirableValue'
import type { CacheOptions, CacheUpdateContext, CacheMiddleware } from './type'
import { defaultConfig } from './constants'

/**
 * 缓存中间件
 * 支持：
 * - 自定义缓存 key 生成
 * - 自定义缓存有效期（固定时长或动态计算）
 * - 自定义缓存有效性校验
 * - 自定义存储介质
 */
export const cache = <D = any, R = any>(options?: Partial<CacheOptions<D, R>>): CacheMiddleware<D, R> => {
    const cacheConfig: CacheOptions<D, R> = { ...defaultConfig, ...options }
    
    // 根据 persist 选项创建 CacheStorageFactory 实例
    const cacheStorage = new CacheStorageFactory<R>(cacheConfig.store)

    const getDuration = (ctx: CacheUpdateContext<D, R>) => {
        return typeof cacheConfig.duration === 'function'
            ? cacheConfig.duration(ctx)
            : cacheConfig.duration
    }
    
    const middleware:Middleware<false, D, R> = async ({ config, next }) => {
        // 1. 生成缓存 key
        const key = cacheConfig.key({ config })
        
        // 2. 检查缓存是否存在（直接获取 ExpirableValue）
        const cachedData = await cacheStorage.getCache(key)
        
        if (cachedData) {
            // 3. 检查缓存是否过期
            // 4. 执行自定义有效性校验
            const isValid = await cacheConfig.isValid({
                key,
                config,
                cachedData,
            })
            
            if (isValid) return cachedData
            
            // 缓存过期或无效，清理旧缓存
            cacheStorage.removeItem(key)
        }
        
        // 5. 缓存不存在、已过期或校验失败，执行请求
        const response = await next()
        
        // 6. 计算缓存有效期
        const duration = getDuration({ key, config, cachedData, response })
        
        // 7. 存储缓存
        const newCachedData = createExpirableValue(response, duration)
        cacheStorage.setItem(key, newCachedData)
        
        return response
    }
    
    // 添加中间件类型标记和 storage 实例
    return Object.assign(middleware, { 
        __middlewareType: MIDDLEWARE_TYPE.CACHE as const,
        storage: cacheStorage
    })
}