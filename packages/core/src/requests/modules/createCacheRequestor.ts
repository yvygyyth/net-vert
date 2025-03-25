import { useRequestor } from '@/registry'
import type { Requestor, UnifiedConfig, HandlerParams } from '@/type'
import { useCacheStore } from '@/hooks/useCacheStore'
import { usePromiseCache } from '@/utils/usePromiseCache'
import { methodConfigConverters } from '@/utils/unifiedRequest'

type CacheTime =
  | number
  | (({ config, response }: { config: UnifiedConfig; response: any }) => number)

// 定义 CacheRequestor 类型
type CacheRequestor = {
  key?: (config: UnifiedConfig) => string
  persist?: boolean
  cacheTime?: CacheTime
}

// 默认配置
const defaultCacheConfig: Required<CacheRequestor> = {
  key: (config) => config.url,
  persist: false,
  cacheTime: Infinity
}

// 包装数据
export const wrapWithExpiry = <T>(data: T, cacheTime: number) => {
  return {
    value: data,
    expiresAt: Date.now() + cacheTime
  }
}

// 是否过期
export const isExpired = (cachedData: { expiresAt: number }) => {
  return Date.now() > cachedData.expiresAt
}

// 定义 createCacheRequestor 函数，提供默认参数
const createCacheRequestor = (config: CacheRequestor = {}): Requestor => {
  const mergedConfig = { ...defaultCacheConfig, ...config }
  const store = useCacheStore(mergedConfig.persist)
  const { getPromise, setPromise, delPromise } = usePromiseCache()
  const requestorHandle = {
    get<T extends keyof Requestor>(target: Requestor, prop: T) {
      const originalMethod = (...args: HandlerParams<T>) => {
        const normalization = methodConfigConverters[prop](...args)

        // 生成缓存 key
        const cacheKey = mergedConfig.key(normalization)

        // 检查是否存在相同请求的 Promise，防止重复请求
        const existingPromise = getPromise(cacheKey)

        if (existingPromise) {
          console.log(`===> 已存在该请求: ${cacheKey}`)
          return existingPromise
        }

        const cachedData = store.get(cacheKey)
        if (cachedData && !isExpired(cachedData)) {
          return cachedData.value
        } else {
          const requestPromise = Reflect.apply(target[prop], target, args)
            .then((response: ReturnType<Requestor[T]>) => {
              if (typeof mergedConfig.cacheTime === 'number') {
                store.set(cacheKey, wrapWithExpiry(response, mergedConfig.cacheTime))
              } else {
                store.set(
                  cacheKey,
                  wrapWithExpiry(
                    response,
                    mergedConfig.cacheTime({ config: normalization, response })
                  )
                )
              }

              console.log('===>cache', '成功', cacheKey, response)
              return response
            })
            .finally(() => {
              // 清除promise
              delPromise(cacheKey)
            })
          // 添加promise
          setPromise(cacheKey, requestPromise)
          return requestPromise
        }
      }
      return originalMethod
    }
  }
  const requestor = new Proxy(useRequestor(), requestorHandle)
  return requestor
}

export default createCacheRequestor
