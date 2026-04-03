import type { RequestConfig } from '@/types'

export type RetryContext<D = any> = {
    config: RequestConfig<D>,
    lastResponse: any,
    attempt: number
}

export type RetryOptions<D = any> = {
    retries: number // 最大重试次数 (默认 3)
    delay: number | ((params: RetryContext<D>) => number) // 延迟策略 (默认 0ms)
    retryCondition: (params: RetryContext<D>) => boolean // 重试条件 (默认所有错误都重试)
}