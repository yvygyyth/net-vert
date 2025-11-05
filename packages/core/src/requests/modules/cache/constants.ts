import type { CacheKeyContext, CacheKey, CacheOptions } from './type'
/**
 * 默认缓存 key 生成函数
 * 基于 method + url + data 生成哈希
 */
export const defaultKeyGenerator = (ctx: CacheKeyContext): CacheKey => {
    const { config } = ctx
    const { method, url, data } = config
    return [method, url, JSON.stringify(data)].join('|')
}

/**
 * 默认缓存有效性校验（始终有效）
 */
export const defaultIsValid = () => true


export const defaultDuration = 24 * 60 * 60 * 1000 // 默认 24 小时
/**
 * 默认配置
 */
export const defaultConfig: CacheOptions = {
    key: defaultKeyGenerator,
    duration: defaultDuration,
    isValid: defaultIsValid,
    persist: false, // 默认不持久化，使用内存存储
} as const