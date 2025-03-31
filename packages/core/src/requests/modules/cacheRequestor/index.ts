import { useRequestor } from '@/registry'
import type { Requestor, UnifiedConfig, HandlerParams } from '@/type'
import { useCacheStore } from './useCacheStore'
import { usePromiseCache } from '@/utils/usePromiseCache'
import { methodConfigConverters } from '@/utils/unifiedRequest'
import { wrapWithExpiry, isPeriodOfValidity } from './utils'

import type { CacheRequestor } from './types'

// 默认配置
const defaultConfig = {
    key: (config: UnifiedConfig) => config.url,
    persist: false,
    duration: Infinity,
    sync: false
}
// 定义 createCacheRequestor 函数，提供默认参数
const createCacheRequestor = <
    P extends boolean = false,
    S extends boolean = false
>(config?: CacheRequestor<P, S>): Requestor => {
    const mergedConfig = { ...defaultConfig, ...config }
    const { name, persist, sync } = mergedConfig
    
    const store = useCacheStore({ persist, name, sync })
    
    const { getPromise, setPromise, delPromise } = usePromiseCache()

    function handleSyncCacheCheck(cacheKey: string, config: UnifiedConfig) {
        const { isValid } = mergedConfig as CacheRequestor<P, true>
        const cachedData = store.get(cacheKey)
        let shouldUseCache = false

        if (cachedData && isPeriodOfValidity(cachedData)) {
            try {
                shouldUseCache = isValid?.({
                    key: cacheKey,
                    config,
                    cachedData
                }) ?? true
            } catch (e) {
                console.error(`校验异常 ${cacheKey}`, e)
            }
            // 提前释放空间
            !shouldUseCache && store.remove(cacheKey)
        }
        return { shouldUseCache, cachedData }
    }

    async function handleCacheCheck(cacheKey: string, config: UnifiedConfig) {
        const { isValid } = mergedConfig as CacheRequestor<P, false>
        const cachedData = await store.get(cacheKey)
        let shouldUseCache = false

        if (cachedData && isPeriodOfValidity(cachedData)) {
            try {
                shouldUseCache = await isValid?.({
                    key: cacheKey,
                    config,
                    cachedData
                }) ?? true
            } catch (e) {
                console.error(`校验异常 ${cacheKey}`, e)
            }
            !shouldUseCache && store.remove(cacheKey)
        }
        return { shouldUseCache, cachedData }
    }

    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {

            function requestorHandle(
                cacheKey:string,
                normalization: UnifiedConfig,
                ...args: HandlerParams<T>
            ){
                // 创建新请求
                const requestPromise = Reflect.apply(target[prop], target, args)
                    .then(async (response: ReturnType<Requestor[T]>) => {
                        // 计算缓存时长
                        const duration = typeof mergedConfig.duration === 'number'
                            ? mergedConfig.duration
                            : mergedConfig.duration({ 
                                key: cacheKey, 
                                config: normalization, 
                                response 
                            });
        
                        store.set(cacheKey, wrapWithExpiry(response, duration));
                        return response;
                    })
                    .finally(() => {
                        delPromise(cacheKey);
                    });
        
                setPromise(cacheKey, requestPromise);
                return requestPromise;
            }

            const originalSyncMethod = (...args: HandlerParams<T>) => {
                const normalization = methodConfigConverters[prop](...args)

                // 生成缓存 key
                const cacheKey = mergedConfig.key(normalization)

                // 检查是否存在相同请求的 Promise，防止重复请求
                const existingPromise = getPromise(cacheKey)

                if (existingPromise) {
                    return existingPromise
                }

                const { shouldUseCache, cachedData } = handleSyncCacheCheck(cacheKey, normalization)

                // 缓存命中
                if (shouldUseCache) {
                    console.log('缓存命中', cacheKey, cachedData.value);
                    return cachedData.value;
                }
                
                // 创建新请求
                return requestorHandle(cacheKey, normalization, ...args)
            }

            const originalMethod = async(...args: HandlerParams<T>) => {
                const normalization = methodConfigConverters[prop](...args)

                // 生成缓存 key
                const cacheKey = mergedConfig.key(normalization)

                // 检查是否存在相同请求的 Promise，防止重复请求
                const existingPromise = getPromise(cacheKey)

                if (existingPromise) {
                    return existingPromise
                }

                const { shouldUseCache, cachedData } = await handleCacheCheck(cacheKey, normalization)

                // 缓存命中
                if (shouldUseCache) {
                    return cachedData.value;
                }
        
                // 创建新请求
                return requestorHandle(cacheKey, normalization, ...args)
            }

            return sync ? originalSyncMethod : originalMethod
        }
    }
    const requestor = new Proxy(useRequestor(), requestorHandle)
    return requestor
}

export default createCacheRequestor
