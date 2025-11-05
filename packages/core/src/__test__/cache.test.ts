import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { cache, idempotent } from '../requests'
import { createMockRequestor, type Data } from './test-utils'

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

    it('应该测试缓存功能：缓存过期后缓存失效', async () => {
        // 使用公共工具创建 mock 请求器
        const mock = createMockRequestor()

        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({
                    duration: 500 // 5秒缓存
                })
            ]
        })

        // 发起第一次请求
        const result1 = await requestor.get<Data>('/api/users')
        const timestamp1 = result1.data.timestamp

        // 等待100ms后发起第二次相同请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const result2 = await requestor.get<Data>('/api/users')
        const timestamp2 = result2.data.timestamp
        
        // 验证：两次结果时间戳不同说明缓存失效
        expect(timestamp1).not.toBe(timestamp2)
    })

    it('应该测试缓存功能：未加幂等性校验，会连续请求两次', async () => {
        // 使用公共工具创建 mock 请求器
        const mock = createMockRequestor()

        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({
                    duration: 500 // 500ms缓存（较短，便于测试）
                })
            ]
        })

        // 并发发起两次相同请求
        const promise1 = requestor.get<Data>('/api/users')
        const promise2 = requestor.get<Data>('/api/users')

        await Promise.all([promise1, promise2])

        // 核心验证：由于没加幂等性校验，mock 请求器会被调用两次
        // 这证明了缓存模块在并发场景下没有防止重复请求
        expect(mock.mockRequestor).toHaveBeenCalledTimes(2)
        expect(mock.callCount).toBe(2)
    })


    it('应该测试缓存功能：自定义 key 生成函数，不同参数使用不同缓存', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({
                    duration: 5000,
                    // 自定义 key：只根据 url 生成，忽略其他参数
                    key: ({ config }) => `custom_${config.url}`
                })
            ]
        })

        // 相同 URL，不同参数
        const result1 = await requestor.get<Data>('/api/users', { params: { id: 1 } })
        const result2 = await requestor.get<Data>('/api/users', { params: { id: 2 } })

        // 因为 key 只基于 url，所以第二次请求会命中第一次的缓存
        expect(mock.callCount).toBe(1)
        expect(result1.data.callCount).toBe(1)
        expect(result2.data.callCount).toBe(1) // 复用了第一次的结果
    })


    it('应该测试缓存功能：自定义 isValid 校验，根据业务逻辑判断缓存有效性', async () => {
        let shouldInvalidate = false
        
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({
                    duration: 10000, // 10 秒缓存
                    // 自定义有效性校验
                    isValid: ({ cachedData }) => {
                        // 如果外部标记需要失效，则返回 false
                        if (shouldInvalidate) {
                            return false
                        }
                        // 还可以根据缓存数据的内容判断
                        return true
                    }
                })
            ]
        })

        // 第一次请求
        const result1 = await requestor.get<Data>('/api/users')
        expect(mock.callCount).toBe(1)

        // 第二次请求：缓存有效
        const result2 = await requestor.get<Data>('/api/users')
        expect(mock.callCount).toBe(1)
        expect(result2.data.callCount).toBe(1)

        // 标记缓存失效
        shouldInvalidate = true

        // 第三次请求：虽然缓存没过期，但 isValid 返回 false，会重新请求
        const result3 = await requestor.get<Data>('/api/users')
        expect(mock.callCount).toBe(2) // 发起了新的请求
        expect(result3.data.callCount).toBe(2)
    })


    it('应该测试缓存功能：POST 请求带不同 data，使用不同缓存', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                cache({ duration: 5000 })
            ]
        })

        // 相同 URL，不同 data
        const result1 = await requestor.post<Data>('/api/users', { name: 'Alice' })
        const result2 = await requestor.post<Data>('/api/users', { name: 'Bob' })
        const result3 = await requestor.post<Data>('/api/users', { name: 'Alice' }) // 与第一次相同

        // 前两次 data 不同，都会执行
        expect(mock.callCount).toBe(2)
        
        // 第三次与第一次 data 相同，命中缓存
        expect(result3.data.callCount).toBe(1)
        expect(result1.data.callCount).toBe(1)
        expect(result2.data.callCount).toBe(2)
    })
    
})

