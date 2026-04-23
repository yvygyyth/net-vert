import type {
    CreateRequestorConfig,
    DefaultRegistryKey,
    Requestor,
    Middleware,
    RequestorRegistry,
} from '@/types';
import { DEFAULT_KEY } from '@/constants';
import { useRequestor } from '@/utils/registry';
import { createRequestAdapter } from '@/utils/unifiedRequest';

type CreateRequestor = {
    /** 传具体 key：从 RequestorRegistry 推导请求器类型 */
    <K extends keyof RequestorRegistry, const Ext extends readonly Middleware[] = []>(
        config: CreateRequestorConfig<Ext, K> & { instanceKey: K },
    ): Requestor<K>;

    /** 不传 key（或显式不写 instanceKey）：走 default 注册类型，与 useRequestor() 一致 */
    <const Ext extends readonly Middleware[] = []>(
        config?: CreateRequestorConfig<Ext> & { instanceKey?: undefined },
    ): Requestor<DefaultRegistryKey>;
};

const createRequestor: CreateRequestor = ((config?: {
    extensions?: readonly Middleware[];
    instanceKey?: keyof RequestorRegistry;
}) => {
    const { extensions, instanceKey = DEFAULT_KEY } = config ?? {};
    const baseRequestor = useRequestor(instanceKey);
    return createRequestAdapter<typeof instanceKey>(baseRequestor, extensions);
}) as CreateRequestor;

export { createRequestor };
