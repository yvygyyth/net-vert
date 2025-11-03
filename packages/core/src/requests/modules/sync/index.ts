import { MemoryStorage } from '@/utils/MemoryStorage'
import type { TypedMiddleware, Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { SyncOptions, SyncContext } from './type'

const createKey = (params: SyncContext) => {
    const { config } = params
    const { method, url } = config
    const hash = [method, url].join('|')
    return hash
}   

const defaultConfig: SyncOptions = {
    key: createKey as (params: SyncContext) => string,
}

/**
 * 缓存中有数据则直接返回。
 * 否则会抛出一个 Promise（而不是普通错误），Promise resolve 后得到数据。
 *
 * ⚠️ 注意：
 *  - 这是一个 Suspense 风格的中间件。
 *  - 如果你没有用 try/catch 捕获它，可能会导致未处理的 Promise。
 */
export const sync = <D = any, R = any>(options?: Partial<SyncOptions<D>>): TypedMiddleware<typeof MIDDLEWARE_TYPE.SYNC, true, D, R> => {
    const syncConfig = { ...defaultConfig, ...options }
    const storage = new MemoryStorage()
    const middleware: Middleware<true, D, R> = ({ config, next }) => {
        const key = syncConfig.key({ config })
        const existingData = storage.getItem(key)
        if (existingData) {
            return existingData as R
        }

        throw (next() as Promise<R>).then((data: R) => {
            storage.setItem(key, data)
            return data
        })
    }
    
    // 添加中间件类型标记
    return Object.assign(middleware, { __middlewareType: MIDDLEWARE_TYPE.SYNC })
}