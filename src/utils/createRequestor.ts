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
    <
        K extends keyof RequestorRegistry = DefaultRegistryKey,
        const Ext extends readonly Middleware[] = [],
    >(
        config?: CreateRequestorConfig<Ext, K>,
    ): Requestor<K>;
};

const createRequestor: CreateRequestor = (config?: {
    extensions?: readonly Middleware[];
    instanceKey?: keyof RequestorRegistry;
}) => {
    const { extensions, instanceKey = DEFAULT_KEY } = config ?? {};
    const baseRequestor = useRequestor(instanceKey);
    return createRequestAdapter<typeof instanceKey>(baseRequestor, extensions);
};

export { createRequestor };
