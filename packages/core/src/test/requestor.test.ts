import { requestor } from './index'
import { inject, useRequestor, requestExtender } from '@/index'

import { describe, it, expect } from 'vitest';

describe('测试 Express 服务接口', () => {
    inject(requestor)
    it('GET /api/greet 应该返回正确的问候信息', async () => {
        const request = useRequestor()

        const response = await request.get('/api/greet');

        console.log(response)
    });

    it('GET /api/not-found 应该返回 404 错误', async () => {
        const response = await fetch('http://localhost:1234/api/not-found');
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({ error: 'Resource not found' });
    });

    it('GET /api/server-error 应该返回 500 错误', async () => {
        const response = await fetch('http://localhost:1234/api/server-error');
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Internal Server Error' });
    });
});


