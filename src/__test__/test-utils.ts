import { vi } from 'vitest';
import { inject, useRequestor } from '../index';
import type { Key } from '../types';
import type { RequestConfig } from '../types/base';

/**
 * 给 RequestorRegistry / inject 用的请求器类型。
 * vi.fn 的返回值是 Vitest 的 Mock<...>，会把「可调用泛型」抹成固定签名，
 * 导致 `useRequestor()` 推出来的 default 不能写 `<R>()`。
 * 这里单独声明可泛型调用的签名，并对 vi.fn 结果做断言。
 */
export type MockRequestorCallable = <R = any, D = any>(config: D) => Promise<Response<R>>;

/**
 * 标准响应接口
 */
export type Response<T = any> = {
    code: number;
    msg: string;
    data: T;
};

/**
 * 标准数据接口
 */
export interface Data {
    url: string;
    method: string;
    data?: any;
    callCount?: number;
    timestamp?: number;
    [key: string]: any;
}

/**
 * Mock 请求器选项
 */
export interface MockRequestorOptions {
    /** 延迟时间（毫秒），默认 50ms */
    delay?: number;
    /** 是否在特定条件下失败 */
    shouldFail?: (callCount: number, config: any) => boolean;
}

export const TEST_UTILS_MOCK_KEY = '__test_utils_mock__' as const;

declare module '@/types/index' {
    interface RequestorRegistry {
        [TEST_UTILS_MOCK_KEY]: MockRequestorCallable;
    }
}

/**
 * 创建一个 mock 请求器
 *
 * @example
 * ```ts
 * const { mockRequestor, callCount } = createMockRequestor()
 * inject(mockRequestor)
 * ```
 */
export function createMockRequestor(options: MockRequestorOptions = {}) {
    const { delay = 50, shouldFail } = options;

    let callCount = 0;

    const mockRequestorImpl = vi.fn(async (config: RequestConfig): Promise<Response<Data>> => {
        callCount++;

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, delay));

        // 检查是否应该失败
        if (shouldFail && shouldFail(callCount, config)) {
            throw new Error(`请求失败 (第 ${callCount} 次)`);
        }

        // 生成响应数据
        const data = {
            url: config.url,
            method: config.method,
            data: config.data,
            callCount,
            timestamp: Date.now(),
        };

        return {
            code: 200,
            msg: '请求成功',
            data,
        };
    });

    const mockRequestor = mockRequestorImpl as MockRequestorCallable;

    return {
        mockRequestor,
        get callCount() {
            return callCount;
        },
        reset() {
            callCount = 0;
            mockRequestorImpl.mockClear();
        },
    };
}

/**
 * 在 test-utils 内直接演示两种 useRequestor 用法：
 * 1) useRequestor<typeof mock.mockRequestor>(key)
 * 2) useRequestor(key) 依赖 RequestorRegistry 自动推导
 */
export function setupInjectedMockRequestor(
    key: Key = TEST_UTILS_MOCK_KEY,
    options: MockRequestorOptions = {},
) {
    const mock = createMockRequestor(options);
    inject(mock.mockRequestor, key);

    const requestorByGeneric = useRequestor<MockRequestorCallable>(key);
    const requestorByKey =
        key === TEST_UTILS_MOCK_KEY ? useRequestor(TEST_UTILS_MOCK_KEY) : undefined;

    return {
        mock,
        requestorByGeneric,
        requestorByKey,
        key,
    };
}

/**
 * 等待指定时间
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建一个失败 N 次后成功的 mock 请求器
 * @param failCount 每个请求失败的次数
 * @param options mock 选项
 */
export function createFailNTimesMockRequestor(
    failCount: number,
    options: MockRequestorOptions = {},
) {
    // 为每个请求独立跟踪失败次数（使用 URL 作为唯一标识）
    const requestFailCounts = new Map<string, number>();

    return createMockRequestor({
        ...options,
        shouldFail: (callCount, config) => {
            const requestKey = config.url || String(callCount);
            const currentFailCount = requestFailCounts.get(requestKey) || 0;

            if (currentFailCount < failCount) {
                requestFailCounts.set(requestKey, currentFailCount + 1);
                return true;
            }

            return false;
        },
    });
}
