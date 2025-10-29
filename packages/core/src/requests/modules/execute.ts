import type { Requestor, HandlerParams, RequestConfig } from '@/types'
import { useRequestor } from '@/registry'
import { methodConfigConverters } from '@/utils/unifiedRequest'
const createExecute = () => {
    const requestorHandle = {
        get<T extends keyof Requestor>(target: Requestor, prop: T) {
            const originalMethod = (...args: HandlerParams<T>) => {
                // 先归一化参数为 RequestConfig
                const normalizedConfig: RequestConfig = methodConfigConverters[prop](...args)

                const execute = () => {
                    return target.request(normalizedConfig).catch((error: any) => {

                        // 传播错误
                        return Promise.reject(error)
                    })
                }
                return execute()
            }

            return originalMethod
        }
    }

    return {
        requestor:new Proxy(useRequestor(), requestorHandle)
    }
    
}

const createRequestor = () => {
   
}


export default createExecute
