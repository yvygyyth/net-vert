import createCacheRequestor from './cacheRequestor'
import type { UnifiedConfig } from '@/type'

const hashRequest = (config: UnifiedConfig) => {
    const { method, url, params, data } = config
    const hash = [method, url, JSON.stringify(params), JSON.stringify(data)].join('|')
    return hash
}

// 默认配置
const defaultConfig = {
    key: hashRequest
}

const createIdempotencyRequestor = (config?:{key?: (config: UnifiedConfig) => string}) => {
    const mergedConfig = { ...defaultConfig, ...config }
    const {
        requestor
    } = createCacheRequestor({
        key: mergedConfig.key,
        persist: false
    })
    
    return {
        requestor
    }
}

export default createIdempotencyRequestor
