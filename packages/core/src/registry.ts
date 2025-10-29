import type { BaseRequestor, Key } from './types'
import { DEFAULT_KEY } from '@/constants'

const instances = new Map<Key, BaseRequestor>()

const inject = (requestor: BaseRequestor, instanceKey = DEFAULT_KEY) => {
  instances.set(instanceKey, requestor)
}
const useRequestor = (instanceKey: Key = DEFAULT_KEY) => {
    const instance = instances.get(instanceKey)
    if (!instance) throw new Error(`Requestor实例 ${String(instanceKey)} 未注册`)
    return instance
}

export { useRequestor, inject }