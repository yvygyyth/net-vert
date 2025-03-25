import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import type { UnifiedRequestor } from '@net-vert/core'

const instance = axios.create({
  baseURL: '/api',
  timeout: 60000
})

export const requestor: UnifiedRequestor = (config) => {
  return instance.request(config as AxiosRequestConfig)
}
