import type { CreateRequestorConfig, Requestor, Middleware, BaseRequestor } from '@/types';
import { useRequestor } from '@/utils/registry';
import { createRequestAdapter, createAdapter } from '@/utils/unifiedRequest';

function fromRegistry<const Extensions extends readonly Middleware[] = [], R = unknown>(
    config: CreateRequestorConfig<Extensions> | undefined,
    attach: (base: BaseRequestor, extensions: readonly Middleware[] | undefined) => R,
): R {
    const { extensions, instanceKey } = config ?? {};
    return attach(useRequestor(instanceKey), extensions);
}

/**
 * 创建请求器
 * @param config 配置对象（可选）
 * @returns 返回 Requestor 实例（所有方法都返回 Promise）
 */
export function createRequestor<const Extensions extends readonly Middleware[] = []>(
    config?: CreateRequestorConfig<Extensions>,
): Requestor {
    return fromRegistry(config, createRequestAdapter);
}

/**
 * 创建基础请求器
 * @param config 配置对象（可选）
 * @returns 返回 BaseRequestor
 */
export function createBaseRequestor<const Extensions extends readonly Middleware[] = []>(
    config?: CreateRequestorConfig<Extensions>,
): BaseRequestor {
    return fromRegistry(config, createAdapter);
}
