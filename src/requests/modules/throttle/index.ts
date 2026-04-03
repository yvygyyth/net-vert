import type { Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { ThrottleOptions, ThrottleMiddleware } from './type'
import { createThrottler } from './throttler'

const defaultConfig: Partial<ThrottleOptions> = {
    interval: 1000
    // timeout 默认 undefined，永不超时
}

/**
 * 节流中间件
 *
 * 确保所有请求按照最小间隔时间排队执行
 *
 * @example
 * ```typescript
 * // 创建节流中间件，每次请求最少间隔 1 秒
 * const throttleMiddleware = throttle({ interval: 1000 })
 *
 * // 带超时控制，超过 5 秒丢弃请求
 * const throttleMiddleware = throttle({
 *   interval: 1000,
 *   timeout: 5000
 * })
 *
 * // 所有使用该中间件的请求共享同一个节流器
 * const api1 = createRequest(config1, [throttleMiddleware])
 * const api2 = createRequest(config2, [throttleMiddleware])
 *
 * // 组合使用
 * const api3 = createRequest(config3, [
 *   cache({ duration: 5000 }),     // 优先走缓存
 *   idempotent(),                  // 去重相同请求
 *   throttle({ interval: 1000 }),  // 限制请求速率
 *   retry({ retries: 3 })          // 失败重试
 * ])
 *
 * // 查看节流器状态
 * throttleMiddleware.throttler.getStatus()
 * ```
 */
export const throttle = <D = any, R = any>(options?: Partial<ThrottleOptions>): ThrottleMiddleware<D, R> => {
    const throttleConfig: ThrottleOptions = { ...defaultConfig, ...options } as ThrottleOptions

    // 创建全局共享的节流器实例
    const throttler = createThrottler(throttleConfig.interval, throttleConfig.timeout)

    const middleware: Middleware<D, R> = async ({ config: _, next }) => {
        // 将任务添加到队列，节流器会自动执行并返回结果
        return throttler.add(next)
    }

    // 添加中间件类型标记和 throttler 实例
    return Object.assign(middleware, {
        __middlewareType: MIDDLEWARE_TYPE.THROTTLE as const,
        throttler
    })
}
