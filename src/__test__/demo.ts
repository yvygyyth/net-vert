// 目标：在 demo 里复现 requestTest.ts 的效果
// const c6 = await createByKey.get<{ id: number }>('/user');
// c6.date;
type RequestConfig<D = unknown> = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: D;
};

type BaseRequestor<R = unknown, D = unknown> = (config: RequestConfig<D>) => Promise<{
    code: number;
    msg: string;
    data: R;
}>;

interface RequestorRegistry {
    custom1: BaseRequestor;
}

// 从 registry 的某个 key 自动拿到“函数返回 Promise 的壳”
type RegistryReturn<K extends keyof RequestorRegistry, R = unknown> = ReturnType<
    RequestorRegistry[K]<R>
>;

type CreateByKey<K extends keyof RequestorRegistry> = {
    get: <R = unknown, D = unknown>(
        url: string,
        config?: Omit<RequestConfig<D>, 'url' | 'method'>,
    ) => RegistryReturn<K, R>;
};

declare function createRequestor<K extends keyof RequestorRegistry>(args: {
    instanceKey: K;
}): CreateByKey<K>;

const createByKey = createRequestor({ instanceKey: 'custom1' });

const demo = async () => {
    const c6 = await createByKey.get<{ id: number }>('/user');
    c6.data.id; // 这里应能自动推导为 { id: number }
};

void demo;
