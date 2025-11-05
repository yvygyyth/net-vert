import type { CreateRequestorConfig, Requestor, Middleware, HasSyncMiddleware } from './types'
import { useRequestor } from './registry'
import { createRequestAdapter } from './utils/unifiedRequest'

// 函数重载：当提供 extensions 时，根据是否包含 SyncMiddleware 返回对应类型
export function createRequestor<
    const Extensions extends readonly Middleware[]
>(
    config: CreateRequestorConfig<Extensions> & { extensions: Extensions }
): Requestor<HasSyncMiddleware<Extensions>>

// 函数重载：未提供配置或未提供 extensions 时，返回 Requestor<false>
export function createRequestor(
    config?: CreateRequestorConfig
): Requestor<false>

// 实现
export function createRequestor<
    const Extensions extends readonly Middleware[] = []
>(
    config?: CreateRequestorConfig<Extensions>
): Requestor<HasSyncMiddleware<Extensions>> {
    const { extensions, instanceKey } = config ?? {}

    const baseRequestor = useRequestor(instanceKey)

    const requestor = createRequestAdapter<HasSyncMiddleware<Extensions>>(
        baseRequestor, 
        extensions
    )

    return requestor
}