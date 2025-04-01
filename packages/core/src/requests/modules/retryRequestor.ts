import type { Requestor, HandlerParams } from '@/type'
import { useRequestor } from '@/registry'

export type RetryOptions = {
    retries?: number // 最大重试次数 (默认 3)
    delay?: number | ((attempt: number) => number) // 延迟策略 (默认 0ms)
    retryCondition?: (error: any) => boolean // 重试条件 (默认所有错误都重试)
}

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

                const execute = () => {
                    return Reflect.apply(target[prop], target, args).catch((error: any) => {
                        // 检查是否满足重试条件
                        if (retryCount < retries && retryCondition(error)) {
                            retryCount++

                            // 计算延迟时间
                            const waitTime = typeof delay === 'function' ? delay(retryCount) : delay

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
