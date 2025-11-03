import type { RequestConfig } from '@/types'

export type IdempotencyContext<D = any> = {
    config: RequestConfig<D>,
}

export type IdempotencyOptions<D = any> = {
    key: (params: IdempotencyContext<D>) => string
}   