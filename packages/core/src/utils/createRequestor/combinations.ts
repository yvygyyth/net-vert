import type { Requestor, FlattenWithInstanceKey } from '@/types'
import { cache } from '@/requests/modules/cache'
import { idempotent } from '@/requests/modules/idempotent'
import { concurrent } from '@/requests/modules/concurrent'
import { retry } from '@/requests/modules/retry'
import type { CacheOptions } from '@/requests/modules/cache/type'
import type { IdempotencyOptions } from '@/requests/modules/idempotent/type'
import type { ConcurrentOptions } from '@/requests/modules/concurrent/type'
import type { RetryOptions } from '@/requests/modules/retry/type'
import { createRequestor } from './index'

/**
 * 缓存 + 幂等组合配置（扁平化）
 */
export type CachedIdempotentConfig<D = any, R = any> = FlattenWithInstanceKey<
    [CacheOptions<D, R>, IdempotencyOptions<D>]
>

/**
 * 并发 + 重试组合配置（扁平化）
 */
export type ConcurrentRetryConfig<D = any> = FlattenWithInstanceKey<
    [ConcurrentOptions<D>, RetryOptions<D>]
>

/**
 * 创建带缓存和幂等的请求器
 * 适用场景：数据查询接口，既需要缓存提升性能，又要避免重复请求
 * @param config 组合配置对象
 */
export function createCachedIdempotentRequestor<D = any, R = any>(
    config: CachedIdempotentConfig<D, R>
): Requestor<false> {
    const { instanceKey, key, duration, isValid, persist, ...idempotentConfig } = config
    
    return createRequestor({
        instanceKey,
        extensions: [
            idempotent(idempotentConfig),
            cache({ key, duration, isValid, persist }),     
        ] as const
    })
}

/**
 * 创建带并发控制和重试的请求器
 * 适用场景：批量请求场景，需要控制并发数量，失败后自动重试
 * @param config 组合配置对象
 */
export function createConcurrentRetryRequestor<D = any>(
    config: ConcurrentRetryConfig<D>
): Requestor<false> {
    const { instanceKey, parallelCount, createId, retries, delay, retryCondition } = config
    
    return createRequestor({
        instanceKey,
        extensions: [
            concurrent({ parallelCount, createId }),
            retry({ retries, delay, retryCondition })
        ] as const
    })
}

