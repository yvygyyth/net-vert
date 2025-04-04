import type { RetryOptions } from '@/requests/modules/retryRequestor'
import createRetryRequestor from '@/requests/modules/retryRequestor'
import { ConcurrentPool } from './concurrentPool'
import { useRequestor } from '@/registry'
import type { Requestor, HandlerParams, UnifiedConfig } from '@/type'
import { methodConfigConverters } from '@/utils/unifiedRequest'
import { randomId } from '@/utils'

type ConcurrentPoolRequestorConfig = {
    parallelCount?: number;
    createId?: (config: UnifiedConfig) => string
} & RetryOptions

const defaultConfig = {
    parallelCount: 4,
    retries: 0,
    createId: () => randomId()
}

const createConcurrentPoolRequestor = (config?: ConcurrentPoolRequestorConfig) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const { parallelCount, createId, ...retryConfig } = mergedConfig

    const pool = new ConcurrentPool(parallelCount)

    const { requestor:retryRequestor = null } = retryConfig.retries > 0 ? createRetryRequestor(retryConfig) : {}

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {
                const normalization = methodConfigConverters[prop](...args)
                const id = createId(normalization)

                const execute = () =>{
                    if (retryRequestor) {
                        return Reflect.apply(retryRequestor[prop], retryRequestor, args)
                    } else {
                        return Reflect.apply(target[prop], target, args)
                    }
                }    

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