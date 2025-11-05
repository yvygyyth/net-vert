import { MemoryStorage } from '@/utils/MemoryStorage'
import { LocalStorage } from '@/utils/LocalStorage'
import type { ExpirableValue } from '@/types/storage'
import { isExpired, extractValue, createExpirableValue } from '@/utils/expirableValue'
import { defaultDuration } from './constants'

/**
 * 缓存存储基类
 * 提供针对缓存场景的快捷方法，自动处理 ExpirableValue 的封装和解封
 */
abstract class BaseCacheStorage<K extends string | number | symbol, R> {
    // 子类需要实现这些 IStorage 方法
    abstract getItem(key: K): ExpirableValue<R> | undefined
    abstract setItem(key: K, value: ExpirableValue<R>): ExpirableValue<R>
    abstract removeItem(key: K): void
    abstract clear(): void
    abstract length(): number
    abstract keys(): K[]
    abstract iterate(iteratee: (value: ExpirableValue<R>, key: K, iterationNumber: number) => void): void

    // ============ 扩展方法（自动处理过期和封装）============

    /**
     * 获取缓存值（自动处理过期检查和解包）
     * @param key 缓存键
     * @returns 缓存的原始值，如果不存在或已过期返回 undefined
     */
    get(key: K): R | undefined {
        const cached = this.getItem(key)
        if (!cached) return undefined
        if (isExpired(cached)) {
            this.removeItem(key)
            return undefined
        }
        return extractValue(cached)
    }

    /**
     * 设置缓存值（自动包装为 ExpirableValue）
     * @param key 缓存键
     * @param value 要缓存的值
     * @param duration 有效期（毫秒），默认 24 小时
     */
    set(key: K, value: R, duration: number = defaultDuration): void {
        const expirableValue = createExpirableValue(value, duration)
        this.setItem(key, expirableValue)
    }

    /**
     * 删除指定缓存（别名方法，等同于 removeItem）
     * @param key 缓存键
     */
    delete(key: K): void {
        this.removeItem(key)
    }

    /**
     * 检查缓存是否存在且未过期
     * @param key 缓存键
     */
    has(key: K): boolean {
        const cached = this.getItem(key)
        if (!cached) return false
        if (isExpired(cached)) {
            this.removeItem(key)
            return false
        }
        return true
    }

    /**
     * 获取缓存数量（别名方法，等同于 length）
     */
    size(): number {
        return this.length()
    }

    /**
     * 遍历所有有效的缓存（自动跳过已过期的，并解包值）
     * @param callback 回调函数，接收解包后的值、键和索引
     */
    forEach(callback: (value: R, key: K, index: number) => void): void {
        let validIndex = 0
        this.iterate((expirableValue, key, _index) => {
            if (!isExpired(expirableValue)) {
                const value = extractValue(expirableValue)
                callback(value, key, validIndex)
                validIndex++
            } else {
                // 清理过期缓存
                this.removeItem(key)
            }
        })
    }

    /**
     * 清理所有过期的缓存
     * @returns 清理的缓存数量
     */
    clearExpired(): number {
        let count = 0
        const allKeys = this.keys()
        allKeys.forEach(key => {
            const cached = this.getItem(key)
            if (cached && isExpired(cached)) {
                this.removeItem(key)
                count++
            }
        })
        return count
    }

    /**
     * 更新缓存的过期时间（不改变值）
     * @param key 缓存键
     * @param duration 新的有效期（毫秒）
     * @returns 是否更新成功
     */
    touch(key: K, duration: number): boolean {
        const cached = this.getItem(key)
        if (!cached) return false
        if (isExpired(cached)) {
            this.removeItem(key)
            return false
        }
        const value = extractValue(cached)
        this.set(key, value, duration)
        return true
    }
}

/**
 * 基于内存的缓存存储
 * 继承 MemoryStorage 并扩展缓存快捷方法
 */
export class CacheMemoryStorage<K extends string | number | symbol = string, R = any> 
    extends MemoryStorage<Record<K, ExpirableValue<R>>> 
    implements BaseCacheStorage<K, R> {
    
    // 继承 MemoryStorage 的所有方法：getItem, setItem, removeItem, clear, length, keys, iterate
    // 从 BaseCacheStorage 继承扩展方法
    get = BaseCacheStorage.prototype.get
    set = BaseCacheStorage.prototype.set
    delete = BaseCacheStorage.prototype.delete
    has = BaseCacheStorage.prototype.has
    size = BaseCacheStorage.prototype.size
    forEach = BaseCacheStorage.prototype.forEach
    clearExpired = BaseCacheStorage.prototype.clearExpired
    touch = BaseCacheStorage.prototype.touch
}

/**
 * 基于 LocalStorage 的缓存存储
 * 继承 LocalStorage 并扩展缓存快捷方法
 */
export class CacheLocalStorage<K extends string | number | symbol = string, R = any> 
    extends LocalStorage<Record<K, ExpirableValue<R>>> 
    implements BaseCacheStorage<K, R> {
    
    // 继承 LocalStorage 的所有方法：getItem, setItem, removeItem, clear, length, keys, iterate
    // 从 BaseCacheStorage 继承扩展方法
    get = BaseCacheStorage.prototype.get
    set = BaseCacheStorage.prototype.set
    delete = BaseCacheStorage.prototype.delete
    has = BaseCacheStorage.prototype.has
    size = BaseCacheStorage.prototype.size
    forEach = BaseCacheStorage.prototype.forEach
    clearExpired = BaseCacheStorage.prototype.clearExpired
    touch = BaseCacheStorage.prototype.touch
}

/**
 * CacheStorage 类型别名
 * 可以是 CacheMemoryStorage 或 CacheLocalStorage
 */
export type CacheStorage<K extends string | number | symbol = string, R = any> = 
    | CacheMemoryStorage<K, R> 
    | CacheLocalStorage<K, R>

