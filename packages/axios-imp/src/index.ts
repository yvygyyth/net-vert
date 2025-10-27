import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:1234',
  timeout: 60000,
  proxy:false
})

export const requestor = (config:any) => {
  return instance.request(config as AxiosRequestConfig).then(res=>res.data)
}



