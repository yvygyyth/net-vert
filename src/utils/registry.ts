import type { BaseRequestor, Key, RequestorRegistry } from '../types';
import { DEFAULT_KEY } from '@/constants';

const instances = new Map<Key, BaseRequestor>();

// inject 自动记忆类型！
const inject = <T extends BaseRequestor>(requestor: T, instanceKey: Key = DEFAULT_KEY) => {
    instances.set(instanceKey, requestor);
};

type UseRequestor = {
    // 方式1：不传参时，优先读取 default key 的注册类型
    (): RequestorRegistry extends { default: infer TRequestor } ? TRequestor : BaseRequestor;
    // 方式2：通过 key 自动推导（需要用户扩展 RequestorRegistry）
    <TKey extends keyof RequestorRegistry>(instanceKey: TKey): RequestorRegistry[TKey];
    // 方式3：通过显式泛型指定返回类型（兼容 useRequestor<typeof customRequest1>()）
    <TRequestor extends BaseRequestor = BaseRequestor>(instanceKey?: Key): TRequestor;
};

const useRequestor: UseRequestor = ((instanceKey: Key = DEFAULT_KEY) => {
    const instance = instances.get(instanceKey);
    if (!instance) throw new Error(`实例未注册`);
    return instance;
}) as UseRequestor;

export { useRequestor, inject, type UseRequestor };
