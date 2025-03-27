import { requestor } from '@/index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'
import { error } from 'console';

import { describe, it, expect } from 'vitest';

describe('测试 Express 服务接口', () => {
    inject(requestor)
    // it('POST /api/data 应该返回正确的问候信息', async () => {
    //     const request = useRequestor()

    //     const response = await request.post('/api/data',{name:123});

    //     console.log(response.data)
    // });

    // it('POST /api/data 应该返回正确的问候信息', async () => {
    //     const request = requestExtender.cacheRequestor()

    //     const response = await request.post('/api/data',{name:1});

    //     console.log(response.data)
    // });

    // it('POST /api/data 应该返回正确的问候信息', async () => {
    //     const request = requestExtender.cacheRequestor()

    //     const response = await request.post('/api/data',{name:1});

    //     console.log(response.data)
    // });

    // it('POST /api/data revey请求', async () => {
    //     const request = requestExtender.retryRequestor({
    //         retryCondition:(error:any) =>{
    //             console.log('error.code',error.code)
    //             return error.code === 'ERR_BAD_REQUEST'
    //         }
    //     })

    //     const response = await request.post('/api/data',{age:5});

    //     console.log(response.data)
    // });


    it('POST /api/data revey请求', async () => {
        const request = requestExtender.idempotencyRequestor()

        await request.post('/api/data',{name:5});
        await request.post('/api/data',{name:5});
        const response = await request.post('/api/data',{name:5});
        console.log(response.data)
    });
});


