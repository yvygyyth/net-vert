import { MemoryStorage } from '@/utils/MemoryStorage'
import type { Middleware } from '@/types'
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

// 有缓存直接返回，没换成报错promise
export const sync = (options?: Partial<SyncOptions>): Middleware => {
    const syncConfig = { ...defaultConfig, ...options }
    const storage = new MemoryStorage()
    return ({ config, next }) => {
        const key = syncConfig.key({ config })
        const existingData = storage.getItem(key)
        if (existingData) {
            return existingData
        }
        throw next().then((data: unknown) => {
            storage.setItem(key, data)
            return data
        })
    }
}