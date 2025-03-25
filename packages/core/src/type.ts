export interface BasicCredentials {
  username: string
  password: string
}

export interface Headers {
  [key: string]: any
}

export interface Data {
  [key: string]: any
}

export interface EnhancedProgressEvent {
  readonly lengthComputable: boolean
  readonly loaded: number
  readonly total: number
  readonly target?: EventTarget
  [key: string]: unknown
}

// 请求配置
export interface RequestConfig<D = any> {
  // 请求url
  url?: string
  // 请求方法
  method?: keyof Requestor
  // baseURL
  baseURL?: string
  // 请求头
  headers?: Headers
  // 请求参数
  params?: any
  // 请求体
  data?: D
  // 超时时间
  timeout?: number
  // `auth` HTTP Basic Auth
  auth?: BasicCredentials
  // 响应体类型
  responseType?: ResponseType
  // 允许为上传处理进度事件
  onUploadProgress?: (progressEvent: EnhancedProgressEvent) => void
  // 允许为下载处理进度事件
  onDownloadProgress?: (progressEvent: EnhancedProgressEvent) => void
  // `validateStatus` 定义了对于给定的 HTTP状态码是 resolve 还是 reject promise。
  // 如果 `validateStatus` 返回 `true` (或者设置为 `null` 或 `undefined`)，
  // 则promise 将会 resolved，否则是 rejected。
  validateStatus?: ((status: number) => boolean) | null
  // 取消请求控制器
  signal?: AbortSignal
}

// 返回体结构
export interface Response<T = any> {
  data: T
  code: number
  msg: string
  count?: number
}

export type UnifiedConfig<D = any> = RequestConfig<D> & {
  url: string
  method: keyof Requestor
}

export type UnifiedRequestor = <T = any, R = Response<T>, D = any>(
  config: UnifiedConfig<D>
) => Promise<R>

export interface Requestor {
  get<T = any, R = Response<T>, D = any>(url: string, config?: RequestConfig<D>): Promise<R>
  post<T = any, R = Response<T>, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<R>
  delete<T = any, R = Response<T>, D = any>(url: string, config?: RequestConfig<D>): Promise<R>
  put<T = any, R = Response<T>, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<R>
  request<T = any, R = Response<T>, D = any>(config: UnifiedConfig<D>): Promise<R>
}

export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>
