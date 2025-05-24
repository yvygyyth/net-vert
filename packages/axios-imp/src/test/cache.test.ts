import { describe, vi, expect, test } from 'vitest'
import { requestor } from '../index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'

describe('测试 Express 服务接口', () => {
    inject(requestor)

    // test('POST /loc/data 缓存超时后应重新发起请求', async () => {    
    //     const {
    //         requestor:request
    //     } = requestExtender.cacheRequestor({
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
    
    // test('sync函数使用', async () => {
    //   const {
    //     requestor:request
    //   } = requestExtender.syncRequestor();
    //   try{
    //     request.post('/loc/data', { id: 1, num:2 })
    //   }catch(e:any){
    //     console.log(e)
    //   }
      
    // });

    // 原来的联合测试被拆分为以下两个独立测试
    test('验证异步模式下并发请求的Promise复用问题', async () => {
      // 测试异步模式(默认, sync: false)
      const {
        requestor: asyncRequest
      } = requestExtender.cacheRequestor({
        key: (config) => config.url + JSON.stringify(config.data || {}),
        duration: 5000,
        // 不指定sync或设为false，使用异步模式
      });
      
      // 同时发起两个完全相同的请求 - 异步模式
      const asyncPromise1 = asyncRequest.post('/loc/data', { name: 'same-data' });
      const asyncPromise2 = asyncRequest.post('/loc/data', { name: 'same-data' });
      
      console.log('异步模式下Promise是否相同:', asyncPromise1,asyncPromise2);
      // 验证：在异步模式下，两个Promise应该是不同的实例
      expect(asyncPromise1).toBe(asyncPromise2); // 问题所在：应该相同但实际不同
      
      // 等待请求完成并验证结果是否相同
      const [asyncResult1, asyncResult2] = await Promise.all([asyncPromise1, asyncPromise2]);
      
      console.log('异步模式下Promise是否相同:', asyncResult1,asyncResult2);
      // 虽然Promise实例不同，但最终结果应该相同（都请求了同一个接口）
      expect(asyncResult1).toEqual(asyncResult2);
    });
    
    // test('验证同步模式下并发请求的Promise复用问题', async () => {
    //   // 同步模式(sync: true)
    //   const {
    //     requestor: syncRequest
    //   } = requestExtender.cacheRequestor({
    //     key: (config) => config.url + JSON.stringify(config.data || {}),
    //     duration: 5000,
    //     sync: true // 明确指定同步模式
    //   });
      
    //   // 同时发起两个完全相同的请求 - 同步模式
    //   const syncPromise1 = syncRequest.post('/loc/data', { name: 'same-data' });
    //   const syncPromise2 = syncRequest.post('/loc/data', { name: 'same-data' });
      
    //   // 验证：在同步模式下，两个Promise应该是相同的实例
    //   console.log('同步模式下Promise是否相同:', syncPromise1 === syncPromise2);
    //   expect(syncPromise1).toBe(syncPromise2); // 这个能通过测试
      
    //   // 等待请求完成并验证结果
    //   const [syncResult1, syncResult2] = await Promise.all([syncPromise1, syncPromise2]);
      
    //   // 同步模式下Promise实例相同，最终结果自然也相同
    //   expect(syncResult1).toBe(syncResult2);
    // });
    
})