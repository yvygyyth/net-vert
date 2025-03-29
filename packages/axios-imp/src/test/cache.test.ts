import { requestor } from '../index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'

import { describe, test, expect } from 'vitest';

describe('测试 Express 服务接口', () => {
    inject(requestor)
    test('缓存命中时应该直接返回缓存的响应数据', async () => {
        const request = requestExtender.cacheRequestor()
    
        // 模拟第一次请求并缓存响应
        const response1 = await request.post('/api/data', { name: 'John' })
        expect(response1.data).toBeDefined()
    
        // 模拟第二次请求，应该直接返回缓存的响应
        const response2 = await request.post('/api/data', { name: 'John' })
        expect(response2.data).toEqual(response1.data) // 确保缓存数据一致
    });
    


    test('should invalidate cache if isValid function returns false', async () => {
        const request = requestExtender.cacheRequestor({
            isValid: async ({ key, config, cachedData }) => {
                // 模拟缓存失效逻辑
                return false
            }
        })
    
        // 模拟第一次请求并缓存响应
        const response1 = await request.post('/api/data', { name: 'Bob' })
        expect(response1.data).toBeDefined()
    
        // 再次请求应该重新发起请求，而不是使用缓存
        const response2 = await request.post('/api/data', { name: 'Bob' })
        expect(response2.data).not.toEqual(response1.data) // 确保响应不一致，缓存被认为是无效的
    });
    

    test('持久化缓存应该在多个请求间生效', async () => {
        const request = requestExtender.cacheRequestor({
            persist: true
        })
    
        // 模拟第一次请求并缓存响应
        const response1 = await request.post('/api/data', { name: 'Charlie' })
        expect(response1.data).toBeDefined()
    
        // 使用相同的缓存键再次请求，应该命中缓存
        const response2 = await request.post('/api/data', { name: 'Charlie' })
        expect(response2.data).toEqual(response1.data) // 确保缓存数据一致
    });
    
    
        
        
    // }, 10000);
});


