import type { RequestConfig } from '@/types'

export type Id = string | number

export type ConcurrentContext<D = any> = {
    config: RequestConfig<D>,
}

export type  ConcurrentOptions<D = any> = {
    parallelCount:number
    createId: (params: ConcurrentContext<D>) => Id
}   