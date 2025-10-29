import createCacheRequestor from './cacheRequestor'
import type { RequestConfig } from '@/types'

const hashRequest = (config: RequestConfig) => {
    const { method, url, params, data } = config
    const hash = [method, url, JSON.stringify(params), JSON.stringify(data)].join('|')
    return hash
}

export type IdempotencyOptions = {
    key?: (config: RequestConfig) => string
}

// 默认配置
const defaultConfig = {
    key: hashRequest,
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
