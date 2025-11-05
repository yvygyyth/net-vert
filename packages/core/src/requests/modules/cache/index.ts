import type { Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import { CacheMemoryStorage, CacheLocalStorage } from './CacheStorage'
import { createExpirableValue, isExpired, extractValue } from '@/utils'
import type { CacheKey, CacheOptions, CacheUpdateContext, CacheMiddleware } from './type'
import { defaultConfig } from './constants'

/**
 * 缓存中间件
 * 支持：
 * - 自定义缓存 key 生成
 * - 自定义缓存有效期（固定时长或动态计算）
 * - 自定义缓存有效性校验
 * - 持久化存储（LocalStorage）或内存存储
 */
export const cache = <D = any, R = any>(options?: Partial<CacheOptions<D, R>>): CacheMiddleware<D, R> => {
    const cacheConfig = { ...defaultConfig, ...options }
    
    // 根据 persist 选项创建 CacheStorage 实例
    const cacheStorage = cacheConfig.persist
        ? new CacheLocalStorage<CacheKey, R>()
        : new CacheMemoryStorage<CacheKey, R>()

    const getDuration = (ctx: CacheUpdateContext<D, R>) => {
        return typeof cacheConfig.duration === 'function'
            ? cacheConfig.duration(ctx)
            : cacheConfig.duration
    }
    
    const middleware:Middleware<false, D, R> = async ({ config, next }) => {
        // 1. 生成缓存 key
        const key = cacheConfig.key({ config })
        
        // 2. 检查缓存是否存在
        const cachedData = cacheStorage.getItem(key)
        
        if (cachedData) {
            // 3. 检查缓存是否过期
            if (!isExpired(cachedData)) {
                // 4. 执行自定义有效性校验
                const isValid = await cacheConfig.isValid({
                    key,
                    config,
                    cachedData,
                })
                
                if (isValid) {
                    // 缓存有效，直接返回
                    return extractValue(cachedData)
                }
            }
            
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