
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

    const tryAgain = (fun:Function) => {
        fun()
    }

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
                    if(error instanceof Promise){
                        error.then(tryAgain)
                    }else{
                        return error
                    }
                }
            }

            return originalMethod
        }
    }

    return {
        requestor:new Proxy(cacheRequestor, requestorHandle),
        tryAgain
    }
}

export default createSyncRequestor