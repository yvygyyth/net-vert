import type { RequestConfig } from '@/types'

export type SyncContext = {
    config: RequestConfig
}

export type SyncOptions = {
    key: (params: SyncContext) => string
}   