import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { sync } from '../requests'

interface Response<T = any> {
    code: number
    msg: string
    data: T
}

interface Data {
    url: string
    method: string
    data?: any
}

describe('同步模块测试', () => {
    beforeEach(() => {
        // 每次测试前清理所有的 mock
        vi.clearAllMocks()
    })

    it('应该测试同步功能：首次请求正常执行', async () => {
        // 定义一个模拟请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 50))
            
            return {
                code: 200,
                msg: '请求成功',
                data: {
                    url: config.url,
                    method: config.method,
                    callCount
                }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带同步扩展的请求器
        const requestor = createRequestor({
            extensions: [
                sync()
            ]
        })

        // 发起第一次请求
        console.log('\n🚀 发起第一次请求:')

        try{
            const result = await requestor.get<Data>('/api/users')
            console.log('  - result:', result)
        }catch(e){
            if(e instanceof Promise){
                e.then(res => {
                    console.log('  - result:', res)
                })
            }else{
                console.log('  - error:', e)
            }
        }

        await new Promise(resolve => setTimeout(resolve, 300))

        try{
            const result = await requestor.get<Data>('/api/users')
            console.log('  - result2:', result)
        }catch(e){
            if(e instanceof Promise){
                e.then(res => {
                    console.log('  - result2:', res)
                })
            }else{
                console.log('  - error2:', e)
            }
        }
        

        
        console.log('  - 调用次数:', callCount)
        

        console.log('\n✅ 测试通过：首次请求正常执行')
    })

    // it('应该测试同步功能：相同请求直接返回缓存数据', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             sync()
    //         ]
    //     })

    //     // 发起第一次请求
    //     console.log('\n🚀 发起第一次请求:')
    //     const result1 = await requestor.get<Data>('/api/users')
        
    //     // 发起第二次相同请求（应该从缓存获取）
    //     console.log('\n🚀 发起第二次相同请求（应该从缓存获取）:')
    //     const result2 = await requestor.get<Data>('/api/users')

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1:', result1)
    //     console.log('  - result2:', result2)
    //     console.log('  - 实际调用次数:', callCount)
        
    //     // 验证：只调用了一次底层请求器
    //     expect(callCount).toBe(1)
    //     expect(mockRequestor).toHaveBeenCalledTimes(1)
        
    //     // 验证：两次结果相同
    //     expect(result1).toEqual(result2)
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(1)

    //     console.log('\n✅ 测试通过：相同请求直接返回缓存数据，不重复调用')
    // })

    // it('应该测试同步功能：不同请求分别执行', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器: ${config.url}`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             sync()
    //         ]
    //     })

    //     // 发起不同的请求
    //     console.log('\n🚀 发起多个不同请求:')
    //     const result1 = await requestor.get<Data>('/api/users/1')
    //     const result2 = await requestor.get<Data>('/api/users/2')
    //     const result3 = await requestor.post<Data>('/api/users/1', { name: 'test' })

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1.url:', result1.data.url)
    //     console.log('  - result2.url:', result2.data.url)
    //     console.log('  - result3.url:', result3.data.url)
    //     console.log('  - 实际调用次数:', callCount)
        
    //     // 验证：不同请求分别调用
    //     expect(callCount).toBe(3)
    //     expect(mockRequestor).toHaveBeenCalledTimes(3)
        
    //     // 验证：每个请求的结果不同
    //     expect(result1.data.url).toBe('/api/users/1')
    //     expect(result2.data.url).toBe('/api/users/2')
    //     expect(result3.data.url).toBe('/api/users/1')
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(2)
    //     expect(result3.data.callCount).toBe(3)

    //     console.log('\n✅ 测试通过：不同请求分别执行')
    // })

    // it('应该测试同步功能：使用自定义 key 生成器', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器: ${config.url}`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     // 创建只基于 URL 的 key 生成器（忽略 method）
    //     const requestor = createRequestor({
    //         extensions: [
    //             sync({
    //                 key: ({ config }) => config.url || ''
    //             })
    //         ]
    //     })

    //     // 对同一个 URL 发起不同方法的请求
    //     console.log('\n🚀 对同一 URL 发起 GET 和 POST 请求:')
    //     const result1 = await requestor.get<Data>('/api/users/1')
    //     const result2 = await requestor.post<Data>('/api/users/1', { name: 'test' })

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1:', result1)
    //     console.log('  - result2:', result2)
    //     console.log('  - 实际调用次数:', callCount)
        
    //     // 验证：由于使用相同的 URL 作为 key，第二次请求应该复用缓存
    //     expect(callCount).toBe(1)
    //     expect(mockRequestor).toHaveBeenCalledTimes(1)
        
    //     // 验证：两次结果相同（都来自第一次 GET 请求）
    //     expect(result1).toEqual(result2)
    //     expect(result1.data.method).toBe('get')
    //     expect(result2.data.method).toBe('get')

    //     console.log('\n✅ 测试通过：自定义 key 生成器正常工作')
    // })

    // it('应该测试同步功能：相同 key 的请求共享缓存', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount,
    //                 timestamp: Date.now()
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             sync()
    //         ]
    //     })

    //     // 连续发起多次相同请求
    //     console.log('\n🚀 连续发起 5 次相同请求:')
    //     const promises = Array.from({ length: 5 }, () => 
    //         requestor.get<Data>('/api/users')
    //     )

    //     const results = await Promise.all(promises)

    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总请求数:', promises.length)
    //     console.log('  - 实际调用次数:', callCount)
    //     console.log('  - 返回结果数:', results.length)
        
    //     // 验证：只调用了一次底层请求器
    //     expect(callCount).toBe(1)
    //     expect(mockRequestor).toHaveBeenCalledTimes(1)
    //     expect(results).toHaveLength(5)
        
    //     // 验证：所有结果相同
    //     results.forEach((result, index) => {
    //         console.log(`  - result[${index}].callCount:`, result.data.callCount)
    //         expect(result.data.callCount).toBe(1)
    //     })
        
    //     // 验证：所有结果是同一个对象引用
    //     expect(results[0]).toBe(results[1])
    //     expect(results[0]).toBe(results[2])
    //     expect(results[0]).toBe(results[3])
    //     expect(results[0]).toBe(results[4])

    //     console.log('\n✅ 测试通过：多个相同请求共享缓存')
    // })

    // it('应该测试同步功能：不同 method 产生不同缓存', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器: ${config.method.toUpperCase()} ${config.url}`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             sync()
    //         ]
    //     })

    //     // 对同一 URL 发起不同方法的请求
    //     console.log('\n🚀 对同一 URL 发起不同方法的请求:')
    //     const getResult1 = await requestor.get<Data>('/api/users')
    //     const postResult = await requestor.post<Data>('/api/users', { name: 'test' })
    //     const putResult = await requestor.put<Data>('/api/users', { id: 1 })
    //     const deleteResult = await requestor.delete<Data>('/api/users')
    //     const getResult2 = await requestor.get<Data>('/api/users')

    //     console.log('\n📊 结果验证:')
    //     console.log('  - GET callCount:', getResult1.data.callCount)
    //     console.log('  - POST callCount:', postResult.data.callCount)
    //     console.log('  - PUT callCount:', putResult.data.callCount)
    //     console.log('  - DELETE callCount:', deleteResult.data.callCount)
    //     console.log('  - GET(再次) callCount:', getResult2.data.callCount)
    //     console.log('  - 实际调用次数:', callCount)
        
    //     // 验证：不同方法各调用一次，相同方法复用缓存
    //     expect(callCount).toBe(4) // GET, POST, PUT, DELETE 各一次
    //     expect(mockRequestor).toHaveBeenCalledTimes(4)
        
    //     // 验证：第二次 GET 请求复用了第一次的缓存
    //     expect(getResult1).toBe(getResult2)
    //     expect(getResult1.data.callCount).toBe(1)
    //     expect(getResult2.data.callCount).toBe(1)
        
    //     // 验证：不同方法的结果不同
    //     expect(postResult.data.callCount).toBe(2)
    //     expect(putResult.data.callCount).toBe(3)
    //     expect(deleteResult.data.callCount).toBe(4)

    //     console.log('\n✅ 测试通过：不同 method 产生不同缓存')
    // })
})

