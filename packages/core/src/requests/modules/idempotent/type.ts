import type { RequestConfig } from '@/types'
import type { TypedMiddleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { PromiseCache } from './createPromiseCache'

export type IdempotencyContext<D = any> = {
    config: RequestConfig<D>,
}

export type IdempotencyOptions<D = any> = {
    key: (params: IdempotencyContext<D>) => string
}

export type IdempotentMiddleware<D = any, R = any> = TypedMiddleware<
    MIDDLEWARE_TYPE.IDEMPOTENT, 
    false, 
    D, 
    R
> & {
    promiseCache: PromiseCache
}