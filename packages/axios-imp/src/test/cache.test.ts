import { describe, vi, expect, test } from 'vitest'
import { requestor } from '../index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'

describe('测试 Express 服务接口', () => {
    inject(requestor)

    // 测试缓存失效时是否重新发起请求
    // test('POST /loc/data 缓存是否有效', async () => {    
    //     const request = requestExtender.cacheRequestor({
    //         key: (config) => config.url,
    //         duration: 10000, // 设置缓存过期
    //     })
    
    //     // 模拟缓存失效
    //     const responseA = await request.post('/loc/data',{name:1})
    //     const responseB = await request.post('/loc/data',{name:1})
    //     expect(responseA).toEqual(responseB)
    // })
    
    // test('POST /loc/data 缓存超时后应重新发起请求', async () => {    
    //     const request = requestExtender.cacheRequestor({
    //         key: (config) => config.url,
    //         duration: 1000,
    //     })
    
    //     // 第一次请求，缓存有效
    //     const responseA = await request.post('/loc/data', { name: 2 })
        
    //     // 等待 1.5 秒（超出缓存时长）
    //     await new Promise(resolve => setTimeout(resolve, 1500))
        
    //     // 第二次请求，缓存应该已失效，需要重新发起请求
    //     const responseB = await request.post('/loc/data', { name: 2 })
    
    //     // 验证两次请求结果相同（但是实际上是重新发起的请求）
    //     // console.log(responseA,responseB)
    //     expect(responseA).not.toBe(responseB) // 若缓存失效，则结果应不相同
    // })
    
    // test('isValid 返回 false 时应跳过缓存', async () => {
    //     const request = requestExtender.cacheRequestor({
    //       duration: 5000,
    //       isValid: (e) => {
    //         // 仅当缓存数据包含特定字段时有效
    //         console.log(e)
    //         return false
    //       }
    //     });
      
    //     // 第一次请求（缓存无效）
    //     const responseA = await request.post('/loc/data', { id: 1 });
        
    //     // 第二次请求（isValid 返回 false → 重新请求）
    //     const responseB = await request.post('/loc/data', { id: 1 });
      
    //     expect(responseB).not.toBe(responseA); // 缓存未复用
    // });

    // test('sync同步，缓存是否同步返回', async () => {
    //     const {
    //       requestor:request
    //     } = requestExtender.cacheRequestor({
    //       duration: 5000,
    //       sync: true
    //     });
      
    //     // 第一次请求（缓存无效）
    //     const responseA = request.post('/loc/data', { id: 1 });
        
    //     // 第二次请求（isValid 返回 false → 重新请求）
    //     let responseB
    //     let responseC
    //     await new Promise((resolve)=>{
    //       setTimeout(() => {
    //         responseB = request.post('/loc/data', { id: 1 });
    //         responseC = request.post('/loc/data', { id: 1 });
    //         resolve(console.log(responseA, responseB, responseC))
    //       }, 10);
    //     })
        
        
    //     // expect(responseB).toBe(responseA); // 缓存未复用
    // });
    
    test('sync函数使用', async () => {
      const {
        requestor:request
      } = requestExtender.syncRequestor();
    
      request.post('/loc/data', { id: 1, num:2 })
    });

    // test('异步 isValid 应正确拦截缓存', async () => {
    //     const request = requestExtender.cacheRequestor({
    //       duration: 5000,
    //       persist: false,
    //       isValid: async ({ cachedData }) => {
    //         // 模拟异步校验（如查询数据库）
    //         await new Promise(resolve => setTimeout(resolve, 100));
    //         console.log(cachedData.value.num, cachedData.value.num % 2 === 0)
    //         return cachedData.value.num % 2 === 0;
    //       }
    //     });
      
    //     // 第一次请求（假设时间戳为奇数）
    //     const responseA = await request.post('/loc/data', { id: 1, num:2 });
        
    //     // 第二次请求（缓存无效 → 重新请求）
    //     const responseB = await request.post('/loc/data', { id: 1, num:1 });
      
    //     expect(responseB).toBe(responseA);
    // });
    
})