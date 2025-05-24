import createCacheRequestor from './cacheRequestor'
import type { UnifiedConfig } from '@/type'

const hashRequest = (config: UnifiedConfig) => {
    const { method, url, params, data } = config
    const hash = [method, url, JSON.stringify(params), JSON.stringify(data)].join('|')
    return hash
}

export type IdempotencyOptions = {
    key?: (config: UnifiedConfig) => string
    duration?: number
}

// 默认配置
const defaultConfig = {
    key: hashRequest,
    duration: 1000
}

const createIdempotencyRequestor = (config?:IdempotencyOptions) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const {
        requestor,
        store
    } = createCacheRequestor({
        ...mergedConfig,
        persist: false,
    })
    
    return {
        requestor,
        store
    }
}

export default createIdempotencyRequestor
