import type { RetryOptions } from '@/requests/modules/retryRequestor'
import createRetryRequestor from '@/requests/modules/retryRequestor'
import { ConcurrentPool } from './concurrentPool'
import { useRequestor } from '@/registry'
import type { Requestor, HandlerParams, UnifiedConfig } from '@/type'
import { methodConfigConverters } from '@/utils/unifiedRequest'

type ConcurrentPoolRequestorConfig = {
    parallelCount?: number;
    createId?: (config: UnifiedConfig) => string
} & RetryOptions

const defaultConfig = {
    parallelCount: 4,
    retries: 1,
    createId: () => `${Date.now()}_${Math.random().toString().slice(2, 8)}`
}

const createConcurrentPoolRequestor = (config: ConcurrentPoolRequestorConfig) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const { parallelCount, createId, ...retryConfig } = mergedConfig

    // Only create retryRequestor when retries > 1
    const retryRequestor = retryConfig.retries > 1 ? createRetryRequestor(retryConfig) : null
    const pool = new ConcurrentPool(parallelCount)

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {

                const normalization = methodConfigConverters[prop](...args)
                const execute = () =>{
                    if (retryRequestor) {
                        return retryRequestor.request(normalization)
                    } else {
                        return Reflect.apply(target[prop], target, args)
                    }
                }

                const id = createId(normalization)

                return pool.add(id, execute)
            }
        
            return originalMethod
        }
    }
    
    return {
        requestor:new Proxy(useRequestor(), requestorHandle),
        concurrentPool:pool
    }
}

export default createConcurrentPoolRequestor