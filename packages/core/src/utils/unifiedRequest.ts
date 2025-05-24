import type { UnifiedConfig, Requestor, UnifiedRequestor, HandlerParams } from '@/type'

export const methodConfigConverters: {
  [K in keyof Requestor]: (...args: HandlerParams<K>) => UnifiedConfig
} = {
  get: (url, config) => ({
    url,
    method: 'get',
    ...config,
    params: config?.params
  }),

  post: (url, data, config) => ({
    url,
    method: 'post',
    data,
    headers: { 'Content-Type': 'application/json', ...config?.headers },
    ...config
  }),

  delete: (url, config) => ({
    url,
    method: 'delete',
    ...config
  }),

  put: (url, data, config) => ({
    url,
    method: 'put',
    data,
    headers: { 'Content-Type': 'application/json', ...config?.headers },
    ...config
  }),

  request: (config) => config
} as const

export function createRequestAdapter(requestor: UnifiedRequestor): Requestor {
  const methods = {} as Requestor

  (Object.keys(methodConfigConverters) as Array<keyof Requestor>).forEach(
    <K extends keyof Requestor>(method: K) => {
      methods[method] = ((...args: HandlerParams<K>) => {
        const normalizedConfig = methodConfigConverters[method](...args)
        return requestor(normalizedConfig)
      }) as Requestor[K]
    }
  )

  return methods
}
