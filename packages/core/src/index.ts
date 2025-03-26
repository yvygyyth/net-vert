
import requests from './requests/index'
import { useRequestor, inject } from './registry'
import type { UnifiedRequestor, UnifiedConfig, Requestor } from '@/type'

// request实例
export { 
  useRequestor, 
  inject, 
  requests as extendRequestor 
}

export {
  UnifiedRequestor,
  UnifiedConfig,
  Requestor
}