import { inject, useRequestor, createRequestor } from '../index';
import { DEFAULT_KEY, REQUEST_METHOD } from '@/constants';
import { createMockRequestor, type MockRequestorCallable } from './test-utils';
import type { RequestConfig } from '@/types';

type Custom3Wrapped<T> = {
    code: number;
    msg: string;
    payload: {
        result: {
            data: T;
        };
    };
};

type Custom4Wrapped<T> = {
    code: number;
    msg: string;
    payload: {
        result: {
            date: T;
        };
    };
};

// Demo：用户在业务侧扩展空接口，建立 key -> 请求器类型映射
declare module '@/types/index' {
    interface RequestorRegistry {
        [DEFAULT_KEY]: MockRequestorCallable;
        custom1: typeof customRequest1;
        custom2: typeof customRequest2;
        custom3: typeof customRequest3;
        custom4: typeof customRequest4;
    }
}

const customRequest1 = <R = any, D = any>(config: RequestConfig<D>) =>
    Promise.resolve({
        code: 0,
        date: {} as R,
        msg: '成功',
        config,
    });

const customRequest2 = <R = any, D = any>(_config: D) => Promise.resolve({} as R);

const customRequest3 = <R = any, D = any>(_config: D): Promise<Custom3Wrapped<R>> =>
    Promise.resolve({
        code: 0,
        msg: '成功',
        payload: {
            result: {
                data: {} as R,
            },
        },
    });

const customRequest4 = <R = any, D = any>(_config: D): Promise<Custom4Wrapped<R>> =>
    Promise.resolve({
        code: 0,
        msg: '成功',
        payload: {
            result: {
                date: {} as R,
            },
        },
    });

const defaultMock = createMockRequestor();

inject(customRequest1, 'custom1');
inject(customRequest2, 'custom2');
inject(customRequest3, 'custom3');
inject(customRequest4, 'custom4');
inject(defaultMock.mockRequestor);

// ============================================================================
// useRequestor 用法清单
// ============================================================================

// 1) useRequestor：传 key + 自动从 RequestorRegistry 推导
const useByKey = useRequestor('custom1');

// 2) useRequestor：不传 key（走 default）+ 自动推导
const useByDefault = useRequestor();

// ============================================================================
// createRequestor 用法清单
// ============================================================================

// 5) createRequestor：传 key + 自动从 RequestorRegistry/ResponseRegistry 推导
const createByKey = createRequestor({
    instanceKey: 'custom1',
});

// 6) createRequestor：不传 key（运行时走 default）+ 自动推导
const createByDefault = createRequestor();

// 额外：custom2 用来演示“无包装壳时直接返回 R”
const useCustom2ByKey = useRequestor('custom2');
// 额外：custom3 用来演示“data 不在第一层（payload.result.data）”
const useCustom3ByKey = useRequestor('custom3');
// 额外：custom4 用来演示“date 不在第一层（payload.result.date）”
const useCustom4ByKey = useRequestor('custom4');

const demo = async () => {
    // 1) use + key + 自动推导（命中 custom1 => date）
    const u1 = await useByKey<{ id: number }>({ url: '/info', method: REQUEST_METHOD.GET });
    u1.date.id;

    // 2) use + default + 自动推导（default 是 mock，返回 data）
    const u2 = await useByDefault<{ id: number; name: string }>({ url: '/user' });
    u2.data.id;

    // 3) create + key + 自动推导（命中 custom1 => date）
    // 注：这里保留 createRequestor 的 callable 用法，避免 .get 链路触发过深推导
    const c1 = await createByKey<{ id: number }>({
        url: '/user',
        method: REQUEST_METHOD.GET,
        data: { id: 1 },
    });
    c1.date.id;

    // 4) create + default + 自动推导（mock => data）
    const c2 = await createByDefault<{ id: number }>({ url: '/user', method: REQUEST_METHOD.GET });
    c2.data.id;

    // 5) custom2：没有包装壳，直接是 R
    const c3 = await useCustom2ByKey<{ id: number }>({ url: '/info' });
    c3.id;

    // 6) custom3：data 在更深层级（payload.result.data）
    const c4 = await useCustom3ByKey<{ id: number }>({ url: '/nested' });
    c4.payload.result.data.id;

    // 7) custom4：date 在更深层级（payload.result.date）
    const c5 = await useCustom4ByKey<{ id: number }>({ url: '/nested-date' });
    c5.payload.result.date.id;

    type Custom1Response<R> = ReturnType<typeof customRequest1<R>>;
    const c6 = await createByKey.get<{ id: number }>('/user', { method: REQUEST_METHOD.GET });
    c6.date;
};

void demo;
