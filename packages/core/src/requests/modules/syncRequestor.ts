
import type { Requestor, HandlerParams } from '@/type'
import createCacheRequestor from './cacheRequestor'
import type { CacheRequestor } from './cacheRequestor/types'

type SyncOptions = {
    persist?: false
    sync?: true
} & CacheRequestor<false, true>

const defaultConfig = {
    persist: false,
    sync: true
}
const createSyncRequestor = (config?: SyncOptions) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const { ...cacheConfig } = mergedConfig
    const {
        requestor:cacheRequestor,
        store
    } = createCacheRequestor(cacheConfig)

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {
                try{
                    const cacheResult = Reflect.apply(target[prop], target, args)
                    // 将异步
                    if(cacheResult instanceof Promise){
                        throw cacheResult
                    }else{
                        return cacheResult
                    }
                }catch(error){
                    throw error
                }
            }

            return originalMethod
        }
    }

    return {
        requestor:new Proxy(cacheRequestor, requestorHandle),
        store
    }
}

export default createSyncRequestor