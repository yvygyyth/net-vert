
import type { Requestor, HandlerParams } from '@/type'
import createCacheRequestor from './cacheRequestor'
import type { CacheRequestor } from './cacheRequestor/types'

type SyncOptions = {
    run:Function
    persist?: false
    sync?: true
} & CacheRequestor<false, true>

const defaultConfig = {
    persist: false,
    sync: true
}
const createSyncRequestor = (config?: SyncOptions) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const { run, ...cacheConfig } = mergedConfig
    const {
        requestor:cacheRequestor,
        store
    } = createCacheRequestor(cacheConfig)

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => { 
                try{
                    const cachedData = Reflect.apply(target[prop], target, args)
                    if(store.has(cachedData.key)){
                        return cachedData
                    }else{
                        throw cachedData
                    }
                }catch(error){
                    return error
                }
            }

            return originalMethod
        }
    }

    return {
        requestor:new Proxy(cacheRequestor, requestorHandle)
    }
}

export default createSyncRequestor