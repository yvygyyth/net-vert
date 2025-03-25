import type { UnifiedRequestor, Requestor } from './type'
import { createRequestAdapter } from './utils/unifiedRequest'

const instances = new Map<string, Requestor>()

const inject = (requestor: UnifiedRequestor, instanceKey = 'default') => {
  instances.set(instanceKey, createRequestAdapter(requestor))
}
const useRequestor = (instanceKey = 'default') => {
  const instance = instances.get(instanceKey)
  if (!instance) throw new Error(`Requestor实例 ${instanceKey} 未注册`)
  return instance
}

export { useRequestor, inject }