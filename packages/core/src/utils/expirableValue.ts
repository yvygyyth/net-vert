/**
 * 带过期时间的值类型（通用型）
 * 可用于缓存、幂等、同步等需要时间控制的场景
 */
export type ExpirableValue<T = any> = {
    value: T
    expireAt: number
}

/**
 * 创建一个带过期时间的值
 * @param value 要存储的值
 * @param duration 过期时长（毫秒）
 * @returns 带过期时间的值对象
 */
export function createExpirableValue<T>(value: T, duration: number): ExpirableValue<T> {
    return {
        value,
        expireAt: Date.now() + duration,
    }
}

/**
 * 检查值是否已过期
 * @param expirableValue 带过期时间的值
 * @param now 当前时间戳（可选，默认为 Date.now()）
 * @returns true 表示已过期，false 表示未过期
 */
export function isExpired<T>(expirableValue: ExpirableValue<T>, now = Date.now()): boolean {
    return expirableValue.expireAt <= now
}

/**
 * 提取值（不检查过期）
 * @param expirableValue 带过期时间的值
 * @returns 原始值
 */
export function extractValue<T>(expirableValue: ExpirableValue<T>): T {
    return expirableValue.value
}

/**
 * 提取值（检查过期，如果过期返回 null）
 * @param expirableValue 带过期时间的值
 * @param now 当前时间戳（可选，默认为 Date.now()）
 * @returns 未过期返回值，已过期返回 null
 */
export function extractValidValue<T>(expirableValue: ExpirableValue<T>, now = Date.now()): T | null {
    return isExpired(expirableValue, now) ? null : expirableValue.value
}

