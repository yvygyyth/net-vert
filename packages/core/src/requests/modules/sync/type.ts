import type { RequestConfig } from '@/types'

export type SyncContext<D = any> = {
    config: RequestConfig<D>
}

export type SyncOptions<D = any> = {
    key: (params: SyncContext<D>) => string
}   