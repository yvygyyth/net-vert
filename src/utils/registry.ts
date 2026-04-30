import type { BaseRequestor, Key, RequestorRegistry, DefaultRegistryKey } from '../types';
import { DEFAULT_KEY } from '@/constants';

const instances = new Map<Key, BaseRequestor<Key>>();

// inject 自动记忆类型！
const inject = <K extends keyof RequestorRegistry = DefaultRegistryKey>(
    requestor: BaseRequestor<K>,
    instanceKey: K = DEFAULT_KEY as K,
) => {
    instances.set(instanceKey, requestor);
};

type UseRequestor = {
    // 方式1：不传参时，优先读取 default key 的注册类型
    <K extends keyof RequestorRegistry = DefaultRegistryKey>(): RequestorRegistry[K];
    // 方式2：通过 key 自动推导（需要用户扩展 RequestorRegistry）
    <K extends keyof RequestorRegistry>(instanceKey: K): RequestorRegistry[K];
};

const useRequestor: UseRequestor = (instanceKey: Key = DEFAULT_KEY) => {
    const instance = instances.get(instanceKey);
    if (!instance) throw new Error(`实例未注册`);
    return instance;
};

export { useRequestor, inject, type UseRequestor };
