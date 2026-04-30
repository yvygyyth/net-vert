import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestor, inject } from '../index';
import { createMockRequestor, type Data } from './test-utils';
import type { Middleware } from '@/types';
import { REQUEST_METHOD } from '@/constants';

declare module '@/types/middleware' {
    interface MiddlewareContext {
        traceId?: string;
    }
}

describe('自定义中间件 demo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该支持在 next 前后处理请求和响应', async () => {
        const { mockRequestor } = createMockRequestor();
        inject(mockRequestor);

        const callOrder: string[] = [];

        const customMiddleware: Middleware = async ({ config, next, ctx }) => {
            callOrder.push('before-next');

            // 在请求发送前动态修改配置
            config.headers = {
                ...(config.headers ?? {}),
                'x-demo-middleware': 'enabled',
            };

            // 使用共享上下文在中间件间传递信息
            ctx.traceId = 'trace-demo-001';

            const result = await next();
            callOrder.push('after-next');
            // 包装响应，演示后置处理
            return {
                ...result,
                data: {
                    ...result.data,
                    middlewareTraceId: ctx.traceId,
                },
            };
        };

        const requestor = createRequestor({
            extensions: [customMiddleware],
        });

        const response = await requestor<Data & { middlewareTraceId: string }>({
            url: '/demo/middleware',
            method: REQUEST_METHOD.GET,
        });

        expect(callOrder).toEqual(['before-next', 'after-next']);
        expect(response.code).toBe(200);
        expect(response.data.middlewareTraceId).toBe('trace-demo-001');
        expect(mockRequestor).toHaveBeenCalledTimes(1);
        expect(mockRequestor).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/demo/middleware',
                headers: expect.objectContaining({
                    'x-demo-middleware': 'enabled',
                }),
            }),
        );
    });
});
