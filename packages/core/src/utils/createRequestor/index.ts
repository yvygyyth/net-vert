import type { CreateRequestorConfig, Requestor, Middleware } from '@/types'
import { useRequestor } from '@/registry'
import { createRequestAdapter } from '@/utils/unifiedRequest'

/**
 * 创建请求器
 * @param config 配置对象（可选）
 * @returns 返回 Requestor 实例（所有方法都返回 Promise）
 */
export function createRequestor<
    const Extensions extends readonly Middleware[] = []
>(
    config?: CreateRequestorConfig<Extensions>
): Requestor {
    const { extensions, instanceKey } = config ?? {}

    const baseRequestor = useRequestor(instanceKey)

    const requestor = createRequestAdapter(
        baseRequestor,
        extensions
    )

    return requestor
}
