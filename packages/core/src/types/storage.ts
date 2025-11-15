import type { StoreKey, StoreFactory, Store, AnyRecord, Key } from 'store-vert'

/** 缓存 key 类型 */
export type CacheKey = string | number | symbol

export type StoreDescriptor = StoreKey | {
    key: Key
    factory:StoreFactory<Store<AnyRecord>, any[]>
}

/**
 * 带过期时间的值类型（通用型）
 * 可用于缓存、幂等、同步等需要时间控制的场景
 */
export type ExpirableValue<T = any> = {
    value: T
    expireAt: number
}

/**
 * 将 Schema 的所有值类型映射为 ExpirableValue 包装的版本
 * 用于缓存存储的类型转换
 */
export type ExpirableSchema<Schema extends AnyRecord> = {
    [K in keyof Schema]: ExpirableValue<Schema[K]>
}