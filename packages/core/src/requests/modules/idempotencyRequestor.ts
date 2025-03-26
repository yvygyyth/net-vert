import createCacheRequestor from './cacheRequestor'
import type { UnifiedConfig } from '@/type'

const hashRequest = (config: UnifiedConfig) => {
    const { method, url, params, data } = config
    const hash = [method, url, JSON.stringify(params), JSON.stringify(data)].join('|')
    return hash
}

const createIdempotencyRequestor = (genKey?: (config: UnifiedConfig) => string) => {
    return createCacheRequestor({
        key: (config) => (genKey ? genKey(config) : hashRequest(config)),
        persist: false
    })
}

export default createIdempotencyRequestor
