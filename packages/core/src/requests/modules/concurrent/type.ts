import type { RequestConfig } from '@/types'
import type { TypedMiddleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { ConcurrentPool } from './concurrentPool'

export type Id = string | number

export type ConcurrentContext<D = any> = {
    config: RequestConfig<D>,
}

export type  ConcurrentOptions<D = any> = {
    parallelCount:number
    createId: (params: ConcurrentContext<D>) => Id
}   

export type ConcurrentMiddleware<D = any, R = any> = TypedMiddleware<
    MIDDLEWARE_TYPE.CONCURRENT, 
    false, 
    D, 
    R
> & {
    pool: ConcurrentPool
}