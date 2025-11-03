import type { RequestConfig } from '@/types'

export type CacheStore = 'memory' | 'memoryGlobal' | 'local' | 'session' | 'indexedDB'

/** 缓存 key 类型 */
export type CacheKey = string | number | symbol

/** 缓存数据结构 */
export type CachedData<R = any> = {
    value: R
    expiresAt: number
}

/** 请求前上下文：生成缓存 key */
export interface CacheKeyContext<D = any>    {
    config: RequestConfig<D>
}

/** 请求前上下文：检查缓存是否有效 */
export interface CacheCheckContext<D = any, R = any> {
    key: CacheKey            // 缓存 key
    config: RequestConfig<D>    // 请求配置
    cachedData?: CachedData<R> // 已存在的缓存数据（如果命中）
}

/** 请求后上下文：更新缓存 */
export interface CacheUpdateContext<D = any, R = any> {
    key: CacheKey             // 缓存 key
    config: RequestConfig<D>     // 请求配置
    cachedData?: CachedData<R> // 已存在的缓存数据（如果命中）
    response: R               // 当前请求返回值
}

/** 缓存模块配置 */
export interface CacheOptions<D = any, R = any> {
    /**
     * 缓存 key 生成函数
     * 默认使用 method + url 哈希
     */
    key: (ctx: CacheKeyContext<D>) => CacheKey

    /**
     * 缓存有效期
     * - number: 固定毫秒数
     * - function: 可根据请求或响应动态计算
     */
    duration: number | ((ctx: CacheUpdateContext<D, R>) => number)

    /**
     * 判断缓存是否有效（请求前）
     * - 可以根据现有缓存数据或其他条件动态判断
     * - 返回 boolean 或 Promise<boolean>
     */
    isValid: (ctx: CacheCheckContext<D, R>) => boolean | Promise<boolean>

    /** 缓存介质, 待开发, 目前只支持内存和持久化 */
    // store?: CacheStore
    persist: boolean // 是否持久化
}
