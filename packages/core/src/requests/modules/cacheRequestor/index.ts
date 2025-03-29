import { useRequestor } from '@/registry'
import type { Requestor, UnifiedConfig, HandlerParams } from '@/type'
import { useCacheStore } from '@/hooks/useCacheStore'
import { usePromiseCache } from '@/utils/usePromiseCache'
import { methodConfigConverters } from '@/utils/unifiedRequest'
import { wrapWithExpiry, isExpired } from './utils'

type Duration =
    | number
    | (({ key, config, response }: { key:string, config: UnifiedConfig; response: any }) => number)

type CachedData = {
    value: any
    expiresAt: number
}

// 定义 CacheRequestor 类型
type CacheRequestor = {
    key?: (config: UnifiedConfig) => string
    persist?: boolean
    duration?: Duration,
    isValid?: (params: {
        key: string
        config: UnifiedConfig
        cachedData: CachedData
    }) => boolean | Promise<boolean>
}

// 默认配置
const defaultConfig = {
    key: (config: UnifiedConfig) => config.url,
    persist: false,
    duration: Infinity
}

// 定义 createCacheRequestor 函数，提供默认参数
const createCacheRequestor = (config?: CacheRequestor): Requestor => {
    const mergedConfig = { ...defaultConfig, ...config }
    const store = useCacheStore(mergedConfig.persist)
    const { getPromise, setPromise, delPromise } = usePromiseCache()
    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = async(...args: HandlerParams<T>) => {
                const normalization = methodConfigConverters[prop](...args)

                // 生成缓存 key
                const cacheKey = mergedConfig.key(normalization)

                // 检查是否存在相同请求的 Promise，防止重复请求
                const existingPromise = getPromise(cacheKey)

                if (existingPromise) {
                    return existingPromise
                }

                const cachedData = store.get(cacheKey)
                let shouldUseCache = false;

                if (cachedData && !isExpired(cachedData)) { 
                    try {
                        shouldUseCache = mergedConfig.isValid 
                            ? await mergedConfig.isValid({
                                key: cacheKey,
                                config: normalization,
                                cachedData
                            })
                            : true;
                    } catch (e) {
                        console.error(`校验异常 ${cacheKey}`, e);
                    }

                    if (!shouldUseCache) {
                        store.delete(cacheKey); // 主动清理失效缓存,提前释放空间
                    }
                }

                // 缓存命中
                if (shouldUseCache) {
                    return cachedData.value;
                }
        
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
            return originalMethod
        }
    }
    const requestor = new Proxy(useRequestor(), requestorHandle)
    return requestor
}

export default createCacheRequestor
