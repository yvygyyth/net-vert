import type { Middleware } from '@/types'
import { MemoryStorage } from '@/utils/MemoryStorage'
import { LocalStorage } from '@/utils/LocalStorage'
import type { CachedData, CacheKey, CacheKeyContext, CacheOptions } from './type'

/**
 * 默认缓存 key 生成函数
 * 基于 method + url + data 生成哈希
 */
const defaultKeyGenerator = (ctx: CacheKeyContext): CacheKey => {
    const { config } = ctx
    const { method, url, data } = config
    return [method, url, JSON.stringify(data)].join('|')
}

/**
 * 默认缓存有效性校验（始终有效）
 */
const defaultIsValid = () => true

/**
 * 默认配置
 */
const defaultConfig: CacheOptions = {
    key: defaultKeyGenerator,
    duration: 5 * 60 * 1000, // 默认 5 分钟
    isValid: defaultIsValid,
    persist: false, // 默认不持久化，使用内存存储
}

/**
 * 缓存中间件
 * 支持：
 * - 自定义缓存 key 生成
 * - 自定义缓存有效期（固定时长或动态计算）
 * - 自定义缓存有效性校验
 * - 持久化存储（LocalStorage）或内存存储
 */
export const cache = <T = any>(options?: Partial<CacheOptions<T>>): Middleware => {
    const cacheConfig = { ...defaultConfig, ...options }
    
    // 根据 persist 选项创建存储实例
    const storage = cacheConfig.persist
        ? new LocalStorage<Record<CacheKey, CachedData<T>>>()
        : new MemoryStorage<Record<CacheKey, CachedData<T>>>()
    
    return async ({ config, next }) => {
        // 1. 生成缓存 key
        const key = cacheConfig.key({ config })
        
        // 2. 检查缓存是否存在
        const cachedData = storage.getItem(key)
        
        if (cachedData) {
            // 3. 检查缓存是否过期
            const now = Date.now()
            const isExpired = cachedData.expiresAt <= now
            
            if (!isExpired) {
                // 4. 执行自定义有效性校验
                const isValid = await cacheConfig.isValid({
                    key,
                    config,
                    cachedData,
                })
                
                if (isValid) {
                    // 缓存有效，直接返回
                    return cachedData.value
                }
            }
            
            // 缓存过期或无效，清理旧缓存
            storage.removeItem(key)
        }
        
        // 5. 缓存不存在、已过期或校验失败，执行请求
        const response = await next()
        
        // 6. 计算缓存有效期
        const duration =
            typeof cacheConfig.duration === 'function'
                ? cacheConfig.duration({
                      key,
                      config,
                      cachedData,
                      response,
                  })
                : cacheConfig.duration
        
        // 7. 存储缓存
        const newCachedData: CachedData<T> = {
            value: response,
            expiresAt: Date.now() + duration,
        }
        storage.setItem(key, newCachedData)
        
        return response
    }
}

/**
 * 导出类型，方便外部使用
 */
export type { CacheOptions, CacheKey, CachedData } from './type'