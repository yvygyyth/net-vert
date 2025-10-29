
import type { Middleware } from '@/types'
import type { RetryContext, RetryOptions } from './type'

const defaultConfig: Required<RetryOptions> = {
    retries: 3,
    delay: 0,
    retryCondition: () => true
}

export const retry = (options?: RetryOptions): Middleware => {
    const retryConfig = { ...defaultConfig, ...options }

    return async ({ config, next }) => {
        let attempt = 0
        let lastError: any

        while (attempt <= retryConfig.retries) {
            try {
                const response = await next()
                return response
            } catch (error) {
                lastError = error
                const ctx: RetryContext = {
                    config,
                    lastResponse: error,
                    attempt
                }

                if (!retryConfig.retryCondition(ctx) || attempt === retryConfig.retries) {
                    // 不满足重试条件或已达到最大重试次数
                    throw error
                }

                attempt++
                const waitTime =
                    typeof retryConfig.delay === 'function' ? retryConfig.delay(ctx) : retryConfig.delay

                if (waitTime > 0) {
                    await new Promise((resolve) => setTimeout(resolve, waitTime))
                }
            }
        }

        // 最终抛出最后一次错误
        throw lastError
    }
}