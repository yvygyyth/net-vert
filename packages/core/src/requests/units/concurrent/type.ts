import type { RequestConfig } from '@/types'

export type Id = string | number

export type ConcurrentContext = {
    config: RequestConfig,
}

export type  ConcurrentOptions = {
    parallelCount:number
    createId: (params: ConcurrentContext) => Id
}   