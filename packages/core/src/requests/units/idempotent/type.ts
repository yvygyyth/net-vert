import type { RequestConfig } from '@/types'

export type IdempotencyContext = {
    config: RequestConfig,
}

export type IdempotencyOptions = {
    key?: (params: IdempotencyContext) => string
}   