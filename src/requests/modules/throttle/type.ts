import type { Middleware } from '@/types'
import type { MIDDLEWARE_TYPE } from '@/constants'
import type { Throttler } from './throttler'

/**
 * 节流超时错误
 */
export class ThrottleTimeoutError extends Error {
    constructor(timeout: number, queueTime: number) {
        super(`请求在节流队列中等待超时：配置超时 ${timeout}ms，实际等待 ${queueTime}ms`)
        this.name = 'ThrottleTimeoutError'
    }
}

/**
 * 队列项
 */
export interface QueueItem<T> {
    /** 要执行的任务 */
    task: () => Promise<T>
    /** 任务成功时的回调 */
    resolve: (value: T) => void
    /** 任务失败时的回调 */
    reject: (error: any) => void
    /** 加入队列时间 */
    timestamp: number
}

/**
 * 节流器状态
 */
export interface ThrottlerStatus {
    /** 当前队列长度 */
    queueLength: number
    /** 上次执行时间戳 */
    lastExecutionTime: number
    /** 是否正在处理队列 */
    isProcessing: boolean
    /** 预计下次执行时间 */
    nextExecutionTime: number | null
}

/**
 * 节流中间件配置
 */
export interface ThrottleOptions {
    /**
     * 最小请求间隔（毫秒）
     * @default 1000
     */
    interval: number

    /**
     * 队列超时时间（毫秒）
     * 如果请求在队列中等待超过此时间，将被拒绝并抛出 ThrottleTimeoutError
     * - 不设置（undefined）：永不超时，所有请求都会执行
     * - 设为 0：立即超时，直接拒绝排队的请求
     * - 设为正数：等待指定时间后超时
     * @default undefined
     */
    timeout?: number
}

/**
 * 节流中间件类型
 */
export type ThrottleMiddleware<D = any, R = any> = Middleware<D, R> & {
    __middlewareType: MIDDLEWARE_TYPE.THROTTLE
    throttler: Throttler
}
