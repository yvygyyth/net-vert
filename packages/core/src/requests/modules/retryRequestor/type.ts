import type { RequestConfig } from '@/types'

export interface RetryContext {
    // config: RequestConfig,
    config: RequestConfig,
    lastResponse: any,
    attempt: number
}

export interface RetryOptions {
    retries?: number // 最大重试次数 (默认 3)
    delay?: number | ((params: RetryContext) => number) // 延迟策略 (默认 0ms)
    retryCondition?: (params: RetryContext) => boolean // 重试条件 (默认所有错误都重试)
}