import { requestor } from '../index'
import { inject, useRequestor, requestExtender } from '@net-vert/core'
import { error } from 'console';
import { promises } from 'dns';

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
    //         retries:2,
    //         retryCondition:(error:any) =>{
    //             console.log('error.code',error.code)
    //             return error.code === 'ERR_BAD_REQUEST'
    //         }
    //     })

    //     const allPromise:Promise<any>[] = []

    //     allPromise.push(request.post('/api/delayed-response',{age:15}))
    //     allPromise.push(request.post('/api/delayed-response',{age:12}))
    //     allPromise.push(request.post('/api/delayed-response',{age:11}))
    //     await Promise.all(allPromise)
    // });


    // it('POST /api/data idempotencyRequestor请求', async () => {
    //     const request = requestExtender.idempotencyRequestor()

    //     await request.post('/api/data',{name:5});
    //     await request.post('/api/data',{name:5});
    //     const response = await request.post('/api/data',{name:5});
    //     console.log(response.data)
    // });

    // it('POST /api/delayed-response pool请求', async () => {
    //     const {
    //         requestor,
    //         concurrentPool
    //     } = requestExtender.concurrentPoolRequestor(
    //         {
    //             parallelCount:2,
    //             retries:0
    //         }
    //     )
    //     const promiseAll:Promise<any>[] = []

    //     let xun = 8

    //     while(xun > 0){
    //         const pro = requestor.post('/api/delayed-response',{
    //             num:xun
    //         }).catch((error) => {
    //             console.error('循环内报错', error.data)
    //             return null // Ensure that Promise.all doesn't break
    //         })

    //         promiseAll.push(pro)
    //         xun--
    //     }
    //     console.log('pool',promiseAll)
    //     try{
    //         const all = await Promise.allSettled(promiseAll)

    //         console.log('all',all, promiseAll)
    //     }catch(e){
    //         console.log('e',e)
    //     }
        
        
    // }, 10000);

    it('POST /api/delayed-response pool请求', async () => {
        const {
            requestor,
            concurrentPool
        } = requestExtender.concurrentPoolRequestor(
            {
                parallelCount:2,
                retries:3,
                retryCondition:(error:any) =>{
                    console.log('error.code',error.code)
                    return true
                }
            }
        )
        const promiseAll:Promise<any>[] = []

        let xun = 4

        while(xun > 0){
            const pro = requestor.post('/api/delayed-response',{
                retryNum:xun,
                key:2
            }).catch((error) => {
                console.error('循环内报错', error.data)
                return null // Ensure that Promise.all doesn't break
            })

            promiseAll.push(pro)
            xun--
        }
        console.log('pool',promiseAll)
        try{
            const all = await Promise.allSettled(promiseAll)

            console.log('all',all, promiseAll)
        }catch(e){
            console.log('e',e)
        }
        
        
    }, 10000);
});


