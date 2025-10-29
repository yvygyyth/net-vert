import type { RequestConfig } from '@/types'


export type IdempotencyOptions = {
    key?: (config: RequestConfig) => string
}