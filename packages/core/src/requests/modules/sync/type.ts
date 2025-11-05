import type { RequestConfig } from '@/types'
import type { CacheOptions, CacheKeyContext, CacheKey, CacheCheckContext } from '../cache/type'
import type { ExpirableValue } from '@/utils/expirableValue'

export type SyncKey = CacheKey

export type SyncData<R = any> = ExpirableValue<R>

export type SyncContext<D = any> = CacheKeyContext<D>

export type WrapSuspense<D = any, R = any> = {
    key: CacheKey,
    config: RequestConfig<D>,
    p: Promise<R>
}

export interface SyncOptions<D = any, R = any> extends CacheOptions<D, R>{
    isValid: (ctx: CacheCheckContext<D, R>) => boolean,
    suspense: boolean
    wrapSuspense?: (params: WrapSuspense<D, R>) => any
}   