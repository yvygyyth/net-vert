export {};

// 目标：在 demo 里复现 requestTest.ts 的效果
// const c6 = await createByKey.get<{ id: number }>('/user');
// c6.date;
type RequestConfig<D = unknown> = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: D;
};

type BaseRequestor = <R = unknown, D = unknown>(
    config: RequestConfig<D>,
) => Promise<{
    code: number;
    msg: string;
    data: R;
}>;

type BaseRequestor2 = <R = unknown, D = unknown>(
    config: RequestConfig<D>,
) => Promise<{
    code: number;
    msg: string;
    payload: {
        result: {
            data: R;
        };
    };
}>;

interface RequestorRegistry {
    custom1: BaseRequestor;
    custom2: BaseRequestor2;
}

interface ResponseRegistry<R = any> {
    custom1: {
        code: number;
        msg: string;
        data: R;
    };
    custom2: {
        code: number;
        msg: string;
        payload: {
            result: {
                data: R;
            };
        };
    };
}

type CreateByKey<K extends keyof RequestorRegistry> = {
    get: <R = unknown, D = unknown>(
        url: string,
        config?: Omit<RequestConfig<D>, 'url' | 'method'>,
    ) => Promise<ResponseRegistry<R>[K]>; //ts非法写法
};

declare function createRequestor<K extends keyof RequestorRegistry>(args: {
    instanceKey: K;
}): CreateByKey<K>;

const createByKey = createRequestor({ instanceKey: 'custom1' });
const createByKey2 = createRequestor({ instanceKey: 'custom2' });

const demo = async () => {
    const c6 = await createByKey.get<{ id: number }>('/user');
    c6.data.id; // c6推导为 { code: number; msg: string; data: unknown; }
    const c7 = await createByKey2.get<{ id: number }>('/user');
    c7.payload.result.data.id; // c7推导为 { code: number; msg: string; payload: { result: { data: { id: number } } }; }
};

void demo;
