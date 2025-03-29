// 请求配置
export interface RequestConfig<D = any>{
  // 请求url
  url?: string
  // 请求方法
  method?: keyof Requestor
  // baseURL
  baseURL?: string
  // 请求头
  headers?: Record<string, any>
  // 请求参数
  params?: Record<string, any> | string
  // 请求体
  data?: D
  // 超时时间
  timeout?: number
  // 响应体类型
  responseType?: ResponseType
  // 允许为上传处理进度事件
  onUploadProgress?: <P extends ProgressEvent>(progressEvent: P) => void
  // 允许为下载处理进度事件
  onDownloadProgress?: <P extends ProgressEvent>(progressEvent: P) => void
  // `validateStatus` 定义了对于给定的 HTTP状态码是 resolve 还是 reject promise。
  // 如果 `validateStatus` 返回 `true` (或者设置为 `null` 或 `undefined`)，
  // 则promise 将会 resolved，否则是 rejected。
  validateStatus?: ((status: number) => boolean) | null
  // 取消请求控制器
  signal?: AbortSignal
}


export type UnifiedConfig<D = any> = RequestConfig<D> & {
  url: string
  method: keyof Requestor
}

export type UnifiedRequestor = <R = any, D = any>(
  config: UnifiedConfig<D>
) => Promise<R>

export interface Requestor {
  get<R = any, D = any>(url: string, config?: RequestConfig<D>): Promise<R>
  post<R = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<R>
  delete<R = any, D = any>(url: string, config?: RequestConfig<D>): Promise<R>
  put<R = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<R>
  request<R = any, D = any>(config: UnifiedConfig<D>): Promise<R>
}

export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>