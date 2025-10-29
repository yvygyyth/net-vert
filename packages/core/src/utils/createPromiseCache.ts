type SafeKey = string | symbol

export const createPromiseCache = <T = unknown>() => {
  const cache = new Map<SafeKey, Promise<T>>()

  const getPromise = (key: SafeKey): Promise<T> | undefined => cache.get(key)

  const setPromise = (key: SafeKey, promise: Promise<T>) => {
    cache.set(key, promise)
    promise.finally(() => cache.delete(key))
  }

  const delPromise = (key: SafeKey) => cache.delete(key)

  const clearCache = () => cache.clear()

  return { getPromise, setPromise, delPromise, clearCache }
}
