import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { cache } from '../requests'
import { createMockRequestor, type Response, type Data } from './test-utils'

describe('缓存模块测试', () => {
    beforeEach(() => {
        // 每次测试前清理所有的 mock
        vi.clearAllMocks()
    })

    it('应该测试缓存功能：首次请求正常执行并缓存', async () => {
        // 使用公共工具创建 mock 请求器
        const mock = createMockRequestor()

        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({
                    duration: 5000 // 5秒缓存
                })
            ]
        })

        const result1 = await requestor.get<Data>('/api/users')
        const result2 = await requestor.get<Data>('/api/users')

        expect(result1.data.callCount).toBe(1)
        expect(result2.data.callCount).toBe(1)
        expect(mock.callCount).toBe(1) // 使用 getter 访问 callCount
        expect(mock.mockRequestor).toHaveBeenCalledTimes(1)
    })

    // it('应该测试缓存功能：缓存未过期时直接返回缓存数据', async () => {
    //     // 使用公共工具创建 mock 请求器
    //     const mock = createMockRequestor()

    //     inject(mock.mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: 5000 // 5秒缓存
    //             })
    //         ]
    //     })

    //     // 发起第一次请求
    //     console.log('\n🚀 发起第一次请求:')
    //     const result1 = await requestor.get<Data>('/api/users')
    //     const timestamp1 = result1.data.timestamp

    //     // 等待100ms后发起第二次相同请求（缓存未过期）
    //     await new Promise(resolve => setTimeout(resolve, 100))
        
    //     console.log('\n🚀 发起第二次请求（缓存未过期）:')
    //     const result2 = await requestor.get<Data>('/api/users')
    //     const timestamp2 = result2.data.timestamp

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1.timestamp:', timestamp1)
    //     console.log('  - result2.timestamp:', timestamp2)
    //     console.log('  - 调用次数:', mock.callCount)
        
    //     // 验证：只调用了一次底层请求器
    //     expect(mock.callCount).toBe(1)
    //     expect(mock.mockRequestor).toHaveBeenCalledTimes(1)
        
    //     // 验证：两次结果相同（时间戳相同说明是缓存数据）
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(1)
    //     expect(timestamp1).toBe(timestamp2)

    //     console.log('\n✅ 测试通过：缓存未过期时直接返回缓存数据')
    // })

    // it('应该测试缓存功能：缓存过期后重新请求', async () => {
    //     // 使用公共工具创建 mock 请求器
    //     const mock = createMockRequestor()

    //     inject(mock.mockRequestor)

    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: 200 // 200ms缓存（较短，便于测试）
    //             })
    //         ]
    //     })

    //     // 发起第一次请求
    //     console.log('\n🚀 发起第一次请求:')
    //     const result1 = await requestor.get<Data>('/api/users')
    //     const timestamp1 = result1.data.timestamp

    //     // 等待300ms后发起第二次请求（缓存已过期）
    //     console.log('\n⏳ 等待缓存过期（300ms）...')
    //     await new Promise(resolve => setTimeout(resolve, 300))
        
    //     console.log('\n🚀 发起第二次请求（缓存已过期）:')
    //     const result2 = await requestor.get<Data>('/api/users')
    //     const timestamp2 = result2.data.timestamp

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1.timestamp:', timestamp1)
    //     console.log('  - result2.timestamp:', timestamp2)
    //     console.log('  - 时间差:', timestamp2! - timestamp1!, 'ms')
    //     console.log('  - 调用次数:', mock.callCount)
        
    //     // 验证：调用了两次底层请求器
    //     expect(mock.callCount).toBe(2)
    //     expect(mock.mockRequestor).toHaveBeenCalledTimes(2)
        
    //     // 验证：两次结果不同（时间戳不同说明重新请求了）
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(2)
    //     expect(timestamp2).toBeGreaterThan(timestamp1!)

    //     console.log('\n✅ 测试通过：缓存过期后重新请求')
    // })

    // it('应该测试缓存功能：使用自定义缓存 key 生成器', async () => {
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

    //     // 创建只基于 URL 的 key 生成器（忽略 method）
    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: 5000,
    //                 key: ({ config }) => config.url || ''
    //             })
    //         ]
    //     })

    //     // 对同一个 URL 发起不同方法的请求
    //     console.log('\n🚀 对同一 URL 发起 GET 和 POST 请求:')
    //     const result1 = await requestor.get<Data>('/api/users/1')
    //     const result2 = await requestor.post<Data>('/api/users/1', { name: 'test' })

    //     console.log('\n📊 结果验证:')
    //     console.log('  - result1.method:', result1.data.method)
    //     console.log('  - result2.method:', result2.data.method)
    //     console.log('  - 调用次数:', callCount)
        
    //     // 验证：由于使用相同的 URL 作为 key，第二次请求应该复用缓存
    //     expect(callCount).toBe(1)
    //     expect(mockRequestor).toHaveBeenCalledTimes(1)
        
    //     // 验证：两次结果相同（都来自第一次 GET 请求）
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(1)
    //     expect(result1.data.method).toBe('get')
    //     expect(result2.data.method).toBe('get')

    //     console.log('\n✅ 测试通过：自定义缓存 key 生成器正常工作')
    // })

    // it('应该测试缓存功能：使用动态缓存有效期', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器: ${config.url}`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         // 模拟不同的响应数据
    //         const isImportant = config.url?.includes('important')
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 callCount,
    //                 timestamp: Date.now(),
    //                 important: isImportant
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     // 根据响应数据动态决定缓存时长
    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: ({ response }) => {
    //                     // 重要数据缓存时间更短（100ms）
    //                     // 普通数据缓存时间较长（300ms）
    //                     return response.data.important ? 100 : 300
    //                 }
    //             })
    //         ]
    //     })

    //     // 测试普通数据（缓存300ms）
    //     console.log('\n🚀 请求普通数据（缓存300ms）:')
    //     const normal1 = await requestor.get<Data>('/api/normal')
        
    //     await new Promise(resolve => setTimeout(resolve, 150))
        
    //     const normal2 = await requestor.get<Data>('/api/normal')
        
    //     console.log('  - 普通数据调用次数:', callCount)
    //     expect(callCount).toBe(1) // 缓存未过期，只调用一次
        
    //     // 测试重要数据（缓存100ms）
    //     console.log('\n🚀 请求重要数据（缓存100ms）:')
    //     const important1 = await requestor.get<Data>('/api/important')
        
    //     await new Promise(resolve => setTimeout(resolve, 150))
        
    //     const important2 = await requestor.get<Data>('/api/important')
        
    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总调用次数:', callCount)
    //     console.log('  - 普通数据callCount: 第一次', normal1.data.callCount, '第二次', normal2.data.callCount)
    //     console.log('  - 重要数据callCount: 第一次', important1.data.callCount, '第二次', important2.data.callCount)
        
    //     // 验证：重要数据在150ms后过期，重新请求了
    //     expect(callCount).toBe(3) // normal: 1次, important: 2次（第二次时缓存已过期）
    //     expect(important1.data.callCount).toBe(2)
    //     expect(important2.data.callCount).toBe(3)

    //     console.log('\n✅ 测试通过：动态缓存有效期正常工作')
    // })

    // it('应该测试缓存功能：使用自定义缓存有效性校验', async () => {
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
    //                 callCount,
    //                 timestamp: Date.now(),
    //                 version: callCount // 模拟版本号
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     let shouldInvalidate = false

    //     // 使用自定义有效性校验
    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: 5000,
    //                 isValid: () => {
    //                     // 可以根据外部状态判断缓存是否有效
    //                     return !shouldInvalidate
    //                 }
    //             })
    //         ]
    //     })

    //     // 第一次请求
    //     console.log('\n🚀 第一次请求:')
    //     const result1 = await requestor.get<Data>('/api/users')
        
    //     // 第二次请求（缓存有效）
    //     console.log('\n🚀 第二次请求（缓存有效）:')
    //     const result2 = await requestor.get<Data>('/api/users')
        
    //     console.log('  - 调用次数:', callCount)
    //     expect(callCount).toBe(1)
    //     expect(result2.data.version).toBe(1)
        
    //     // 设置缓存失效标志
    //     console.log('\n🔄 设置缓存失效标志')
    //     shouldInvalidate = true
        
    //     // 第三次请求（缓存失效，重新请求）
    //     console.log('\n🚀 第三次请求（缓存被标记为失效）:')
    //     const result3 = await requestor.get<Data>('/api/users')

    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总调用次数:', callCount)
    //     console.log('  - result1.version:', result1.data.version)
    //     console.log('  - result2.version:', result2.data.version)
    //     console.log('  - result3.version:', result3.data.version)
        
    //     // 验证：缓存失效后重新请求
    //     expect(callCount).toBe(2)
    //     expect(result3.data.version).toBe(2)

    //     console.log('\n✅ 测试通过：自定义缓存有效性校验正常工作')
    // })

    // it('应该测试缓存功能：不同请求各自缓存', async () => {
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
    //             cache({
    //                 duration: 5000
    //             })
    //         ]
    //     })

    //     // 发起不同的请求
    //     console.log('\n🚀 发起多个不同请求:')
    //     const result1 = await requestor.get<Data>('/api/users/1')
    //     const result2 = await requestor.get<Data>('/api/users/2')
    //     const result3 = await requestor.post<Data>('/api/users', { name: 'test' })
        
    //     // 重复请求（应该使用缓存）
    //     const result1Again = await requestor.get<Data>('/api/users/1')
    //     const result2Again = await requestor.get<Data>('/api/users/2')

    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总调用次数:', callCount)
    //     console.log('  - result1.url:', result1.data.url, 'callCount:', result1.data.callCount)
    //     console.log('  - result2.url:', result2.data.url, 'callCount:', result2.data.callCount)
    //     console.log('  - result3.url:', result3.data.url, 'callCount:', result3.data.callCount)
        
    //     // 验证：不同请求各自缓存
    //     expect(callCount).toBe(3)
    //     expect(mockRequestor).toHaveBeenCalledTimes(3)
        
    //     // 验证：重复请求使用缓存
    //     expect(result1Again.data.callCount).toBe(result1.data.callCount)
    //     expect(result2Again.data.callCount).toBe(result2.data.callCount)

    //     console.log('\n✅ 测试通过：不同请求各自缓存')
    // })

    // it('应该测试缓存功能：支持包含请求数据的缓存 key', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器: ${config.url}, data:`, config.data)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 method: config.method,
    //                 requestData: config.data,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     // 默认的缓存 key 包含 method + url + data
    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({
    //                 duration: 5000
    //             })
    //         ]
    //     })

    //     // 相同 URL 和方法，但不同的请求数据
    //     console.log('\n🚀 相同 URL，不同请求数据:')
    //     const result1 = await requestor.post<Data>('/api/users', { id: 1 })
    //     const result2 = await requestor.post<Data>('/api/users', { id: 2 })
    //     const result3 = await requestor.post<Data>('/api/users', { id: 1 }) // 与第一个相同

    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总调用次数:', callCount)
    //     console.log('  - result1.callCount:', result1.data.callCount)
    //     console.log('  - result2.callCount:', result2.data.callCount)
    //     console.log('  - result3.callCount:', result3.data.callCount)
        
    //     // 验证：不同数据产生不同缓存
    //     expect(callCount).toBe(2) // id:1 和 id:2 各一次，第三次复用 id:1 的缓存
    //     expect(result1.data.callCount).toBe(1)
    //     expect(result2.data.callCount).toBe(2)
    //     expect(result3.data.callCount).toBe(1) // 复用第一次的缓存

    //     console.log('\n✅ 测试通过：包含请求数据的缓存 key 正常工作')
    // })

    // it('应该测试缓存功能：与重试结合使用', async () => {
    //     let callCount = 0
    //     const mockRequestor = vi.fn(async (config): Promise<Response> => {
    //         callCount++
    //         console.log(`第 ${callCount} 次调用请求器`)
            
    //         await new Promise(resolve => setTimeout(resolve, 50))
            
    //         // 前2次失败，第3次成功
    //         if (callCount <= 2) {
    //             throw new Error(`请求失败 (第 ${callCount} 次)`)
    //         }
            
    //         return {
    //             code: 200,
    //             msg: '请求成功',
    //             data: {
    //                 url: config.url,
    //                 callCount
    //             }
    //         }
    //     })

    //     inject(mockRequestor)

    //     // 导入 retry 中间件
    //     const { retry } = await import('../requests')

    //     const requestor = createRequestor({
    //         extensions: [
    //             cache({ duration: 5000 }),
    //             retry({ retries: 3, delay: 10 })
    //         ]
    //     })

    //     // 第一次请求（会重试并缓存成功结果）
    //     console.log('\n🚀 第一次请求（会重试）:')
    //     const result1 = await requestor.get<Data>('/api/users')
        
    //     console.log('  - 第一次调用次数:', callCount)
    //     expect(callCount).toBe(3) // 失败2次 + 成功1次
        
    //     // 第二次相同请求（应该使用缓存，不重试）
    //     console.log('\n🚀 第二次请求（使用缓存）:')
    //     const result2 = await requestor.get<Data>('/api/users')

    //     console.log('\n📊 结果验证:')
    //     console.log('  - 总调用次数:', callCount)
    //     console.log('  - result1.callCount:', result1.data.callCount)
    //     console.log('  - result2.callCount:', result2.data.callCount)
        
    //     // 验证：第二次请求使用了缓存
    //     expect(callCount).toBe(3) // 没有增加
    //     expect(result2.data.callCount).toBe(3) // 与第一次相同

    //     console.log('\n✅ 测试通过：缓存与重试功能正确配合')
    // })
})

