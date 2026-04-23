import { inject, useRequestor, createRequestor } from 'net-vert';
import type { RequestConfig } from 'net-vert';

type ApiResponse<T = any> = {
    code: number;
    msg: string;
    data: T;
};

type ApiRequestor = <R = any, D = any>(config: RequestConfig<D>) => Promise<ApiResponse<R>>;

declare module 'net-vert' {
    interface RequestorRegistry {
        default: ApiRequestor;
        custom: ApiRequestor;
    }

    interface ResponseRegistry<R = any, D = any> {
        default: ApiResponse<R>;
        custom: ApiResponse<R>;
    }
}

const customRequestor: ApiRequestor = async config => ({
    code: 200,
    msg: 'ok',
    data: {
        url: config.url,
        method: config.method,
    } as any,
});

inject(customRequestor);
inject(customRequestor, 'custom');

const byDefault = useRequestor();
const byCustom = useRequestor('custom');

const requestorDefault = createRequestor();
const requestorCustom = createRequestor({ instanceKey: 'custom' });

const demo = async () => {
    const u1 = await byDefault<{ id: number }>({ url: '/u1', method: 'get' });
    u1.data.id;

    const u2 = await byCustom<{ name: string }>({ url: '/u2', method: 'get' });
    u2.data.name;

    const c1 = await requestorDefault.get<{ id: number }>('/user');
    c1.data.id;

    const c2 = await requestorCustom.post<{ ok: boolean }, { flag: boolean }>('/save', {
        flag: true,
    });
    c2.data.ok;
};

void demo;
