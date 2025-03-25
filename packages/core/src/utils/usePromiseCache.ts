type SafeKey = string | symbol

export const usePromiseCache = <T = unknown>() => {
  const cache = new Map<SafeKey, Promise<T>>()

  /**
   * 检查缓存中是否已有相同的请求
   * @param key 请求的唯一标识
   * @returns 返回 Promise 或 undefined
   */
  const getPromise = (key: SafeKey): Promise<T> | undefined => {
    return cache.get(key)
  }

  /**
   * 添加新的请求 Promise 到缓存中
   * @param key 请求的唯一标识
   * @param promise 需要缓存的 Promise
   */
  const setPromise = (key: SafeKey, promise: Promise<T>) => {
    cache.set(key, promise)
  }

  /**
   * 从缓存中移除指定的请求
   * @param key 请求的唯一标识
   */
  const delPromise = (key: SafeKey) => {
    cache.delete(key)
  }

  /**
   * 清空所有缓存的 Promise
   */
  const clearCache = () => {
    cache.clear()
  }

  return {
    getPromise,
    setPromise,
    delPromise,
    clearCache
  }
}
