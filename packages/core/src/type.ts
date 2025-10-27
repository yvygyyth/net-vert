// 请求配置
export interface RequestConfig<D = any>{
  // 请求url
  url?: string
  // 请求方法
  method?: Exclude<keyof Requestor, "request">
  // 请求体
  data?: D
}


export type UnifiedConfig<D = any> = RequestConfig<D> & {
  url: string
  method: Exclude<keyof Requestor, "request">
}

export type UnifiedRequestor = <R = any, D = any>(
  config: UnifiedConfig<D>
) => Promise<R>

export type WithDynamicProps<T, V = any> = T & Record<string, V>;

export interface Requestor {
  get<R = any, D = any>(url: string, config?: WithDynamicProps<RequestConfig<D>>): R
  post<R = any, D = any>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): R
  delete<R = any, D = any>(url: string, config?: WithDynamicProps<RequestConfig<D>>): R
  put<R = any, D = any>(
    url: string,
    data?: D,
    config?: WithDynamicProps<RequestConfig<D>>
  ): R
  request<R = any, D = any>(config: WithDynamicProps<UnifiedConfig<D>>): R
}

export type HandlerParams<T extends keyof Requestor> = Parameters<Requestor[T]>