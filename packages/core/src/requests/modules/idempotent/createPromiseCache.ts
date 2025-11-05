type SafeKey = string | number | symbol

export const createPromiseCache = () => {
    const cache = new Map<SafeKey, Promise<any>>()

    const getPromise = <T = unknown>(key: SafeKey): Promise<T> | undefined => {
      return cache.get(key) as Promise<T> | undefined
    }

    const setPromise = <T = unknown>(key: SafeKey, promise: Promise<T>) => {
      cache.set(key, promise)
      promise.finally(() => cache.delete(key))
    }

    const delPromise = (key: SafeKey) => cache.delete(key)

    const clearCache = () => cache.clear()

    return { getPromise, setPromise, delPromise, clearCache }
}

export type PromiseCache = ReturnType<typeof createPromiseCache>