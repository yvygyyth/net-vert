import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import type { UnifiedRequestor, UnifiedConfig } from '@net-vert/core'

const instance = axios.create({
  baseURL: 'http://localhost:1234',
  timeout: 60000,
  proxy:false
})

export const requestor: UnifiedRequestor = (config: UnifiedConfig) => {
  return instance.request(config as AxiosRequestConfig).then(res=>res.data)
}



