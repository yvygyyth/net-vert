import type { TypedMiddleware, Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { RetryContext, RetryOptions } from './type'

const defaultConfig: RetryOptions = {
    retries: 3,
    delay: 0,
    retryCondition: () => true
}

export const retry = <D = any, R = any>(options?: Partial<RetryOptions<D>>): TypedMiddleware<MIDDLEWARE_TYPE.RETRY, false, D, R> => {
    const retryConfig = { ...defaultConfig, ...options }

    const middleware:Middleware<false, D, R> = async ({ config, next }) => {
        let attempt = 0
        let lastError: any

        while (attempt <= retryConfig.retries) {
            try {
                const response = await next()
                return response
            } catch (error) {
                lastError = error
                
                // 如果已达到最大重试次数，直接抛出错误
                if (attempt === retryConfig.retries) {
                    throw error
                }
                
                const ctx: RetryContext = {
                    config,
                    lastResponse: error,
                    attempt
                }

                // 检查是否满足重试条件
                if (!retryConfig.retryCondition(ctx)) {
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
    
    // 添加中间件类型标记
    return Object.assign(middleware, { __middlewareType: MIDDLEWARE_TYPE.RETRY as const })
}