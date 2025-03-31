
import type { Requestor, UnifiedConfig, HandlerParams } from '@/type'
import { useRequestor } from '@/registry'
import createCacheRequestor from './cacheRequestor'
import type { CacheRequestor, CachedData } from './cacheRequestor/types'

type SyncOptions = {
    isValid:(params: {
        key: string
        config: UnifiedConfig
        cachedData: CachedData
    }) => boolean
} & Omit<CacheRequestor,'isValid'>

const createSyncRequestor = (config?: SyncOptions): Requestor => {

    const cacheRequestor = createCacheRequestor()

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {

            }

            return originalMethod
        }
    }

    return new Proxy(useRequestor(), requestorHandle)
}

export default createSyncRequestor