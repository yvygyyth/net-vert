import type { StoreDescriptor, ExpirableSchema, CacheKey } from '@/types/storage'
import { createStore, inject, type EnhancedStore } from 'store-vert'
import { createExpirableValue, isExpired, extractValidValue } from '@/utils/expirableValue'
import { defaultDuration } from './constants'

// 定义缓存 Schema：所有 key 都映射到 R 类型
type CacheSchema<R> = Record<CacheKey, R>

export class ExpirableCacheStorage<R = any>{
    store: EnhancedStore<ExpirableSchema<CacheSchema<R>>>;
    
    constructor(store: StoreDescriptor){
        if (typeof store === 'string') {
            this.store = createStore<ExpirableSchema<CacheSchema<R>>>(store)
        }else{
            inject(store.factory, store.key)
            this.store = createStore<ExpirableSchema<CacheSchema<R>>>(store.key)
        }
        
        // 使用 Proxy 代理所有方法调用到 store
        return new Proxy(this, {
            get(target, prop) {
                // 如果访问的是实例自身的属性，直接返回
                if (prop in target) {
                    return target[prop as keyof ExpirableCacheStorage<R>]
                }
                // 否则代理到 store
                const value = target.store[prop as keyof EnhancedStore<ExpirableSchema<CacheSchema<R>>>]

                // 如果是函数，绑定 this 上下文
                return typeof value === 'function' ? value.bind(target.store) : value
            }
        }) as unknown as ExpirableCacheStorage<R> & EnhancedStore<ExpirableSchema<CacheSchema<R>>>
    }
    
    /**
     * 设置缓存（自动包装成 ExpirableValue）
     * @param key 缓存 key
     * @param value 要缓存的值
     * @param duration 过期时长（毫秒），默认 24 小时
     */
    setCache(key: CacheKey, value: R, duration: number = defaultDuration): void {
        const expirableValue = createExpirableValue(value, duration);
        this.store.setItem(key, expirableValue);
    }
    
    /**
     * 获取缓存值（检查过期，如果过期返回 undefined）
     * @param key 缓存 key
     * @returns 未过期返回值，已过期返回 undefined
     */
    async getCache(key: CacheKey): Promise<R | undefined> {
        const expirableValue = await this.store.getItem(key)
        if (!expirableValue) {
            return void 0
        }
        return extractValidValue(expirableValue)
    }
    
    /**
     * 检查是否有有效的缓存（未过期）
     * @param key 缓存 key
     * @returns true 表示有有效缓存，false 表示无缓存或已过期
     */
    async hasValidCache(key: CacheKey): Promise<boolean> {
        const expirableValue = await this.store.getItem(key)
        if (!expirableValue) {
            return false
        }
        return !isExpired(expirableValue)
    }
}

// 使用类型断言，让 CacheStorageFactory 具有 EnhancedStore 的所有方法
export const CacheStorageFactory = ExpirableCacheStorage as new <R = any>(store: StoreDescriptor) => ExpirableCacheStorage<R> & EnhancedStore<ExpirableSchema<CacheSchema<R>>>

export type CacheStorageFactory = typeof CacheStorageFactory

// 导出实例类型：CacheStorageFactory 构造函数返回的实例类型
export type CacheStorageInstance<R = any> = ExpirableCacheStorage<R> & EnhancedStore<ExpirableSchema<CacheSchema<R>>>