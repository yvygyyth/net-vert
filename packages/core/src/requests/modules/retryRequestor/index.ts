import type { Requestor, HandlerParams, RequestConfig } from '@/types'
import { useRequestor } from '@/registry'
import { methodConfigConverters } from '@/utils/unifiedRequest'
import type { RetryOptions } from './type'

const defaultConfig: Required<RetryOptions> = {
    retries: 3,
    delay: 0,
    retryCondition: () => true
}

const createRetryRequestor = (config?: RetryOptions) => {
    const { retries, delay, retryCondition } = { ...defaultConfig, ...config }

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {
                let retryCount = 0
                // 先归一化参数为 RequestConfig
                const normalizedConfig: RequestConfig = methodConfigConverters[prop](...args)

                const execute = () => {
                    return Reflect.apply(target[prop], target, args).catch((error: any) => {
                        const retryContext = { 
                            config: normalizedConfig, 
                            args, 
                            lastResponse: error, 
                            attempt: retryCount 
                        }
                        // 检查是否满足重试条件
                        if (retryCount < retries && retryCondition(retryContext)) {
                            retryCount++

                            // 计算延迟时间
                            const waitTime = typeof delay === 'function' ? delay(retryContext) : delay

                            return new Promise((resolve) => {
                                setTimeout(() => resolve(execute()), waitTime)
                            })
                        }

                        // 终止重试，传播错误
                        return Promise.reject(error)
                    })
                }
                return execute()
            }

            return originalMethod
        }
    }

    return {
        requestor:new Proxy(useRequestor(), requestorHandle)
    }
    
}

export default createRetryRequestor
