import { requestor } from '../index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'

import { describe, it, expect } from 'vitest';

describe('测试 Express 服务接口', () => {
    inject(requestor)
    it('POST /api/data 应该返回正确的问候信息', async () => {
        const {
            requestor,
            concurrentPool
          } = requestExtender.concurrentPoolRequestor()

        const response = await requestor.post('/loc/data',{name:123});

        console.log(response.data)
    });
});


