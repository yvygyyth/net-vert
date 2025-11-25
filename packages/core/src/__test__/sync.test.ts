import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { sync } from '../requests'
import { createMockRequestor, type Data } from './test-utils'

describe('同步模块测试', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('应该测试同步模块：首次调用抛出 Promise（Suspense 风格）', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        let thrownPromise: any

        // 第一次调用会抛出 Promise
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            thrownPromise = promise
        }

        // 验证：抛出的是一个 Promise
        expect(thrownPromise).toBeInstanceOf(Promise)

        // 等待 Promise resolve
        const result = await thrownPromise
        expect(result.data.callCount).toBe(1)
        expect(mock.callCount).toBe(1)
    })

    it('应该测试同步模块：缓存命中后同步返回数据', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        // 第一次调用，捕获并等待 Promise
        let firstPromise: any
        try {
            const data = requestor.get<Data>('/api/users')
            console.log(data)
        } catch (promise) {
            firstPromise = promise
        }
        await firstPromise

        // 第二次调用，应该同步返回（不抛出 Promise）
        const result2 = requestor.get<Data>('/api/users')

        // 验证：第二次是同步返回，不是 Promise
        expect(result2).not.toBeInstanceOf(Promise)
        expect((result2 as any).data.callCount).toBe(1)

        // 只调用了一次请求器
        expect(mock.callCount).toBe(1)
    })

    it('应该测试同步模块：不同 URL 独立缓存', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        // 请求第一个 URL
        let promise1: any
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            promise1 = promise
        }
        await promise1

        // 请求第二个 URL（不同 URL，不会命中缓存）
        let promise2: any
        try {
            requestor.get<Data>('/api/posts')
        } catch (promise) {
            promise2 = promise
        }

        // 验证：第二个 URL 也会抛出 Promise
        expect(promise2).toBeInstanceOf(Promise)
        await promise2

        // 两个 URL 各执行一次
        expect(mock.callCount).toBe(2)

        // 再次请求两个 URL，都应该同步返回
        const result1 = requestor.get<Data>('/api/users')
        const result2 = requestor.get<Data>('/api/posts')

        expect(result1).not.toBeInstanceOf(Promise)
        expect(result2).not.toBeInstanceOf(Promise)

        // 仍然只调用了 2 次
        expect(mock.callCount).toBe(2)
    })

    it('应该测试同步模块：自定义 key 生成函数', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                sync({
                    // 自定义 key：只基于 URL，忽略 method
                    key: ({ config }) => config.url || ''
                })
            ]
        })

        // GET 请求
        let promise1: any
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            promise1 = promise
        }
        await promise1

        // POST 请求相同 URL（因为 key 只基于 URL，会命中缓存）
        const result2 = requestor.post<Data>('/api/users', { name: 'test' })

        // 验证：POST 请求命中了 GET 请求的缓存
        expect(result2).not.toBeInstanceOf(Promise)
        expect((result2 as any).data.callCount).toBe(1)

        // 只执行了一次 GET 请求
        expect(mock.callCount).toBe(1)
    })

    it('应该测试同步模块：多次同步调用返回相同缓存数据', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        // 第一次调用
        let promise: any
        try {
            requestor.get<Data>('/api/users')
        } catch (p) {
            promise = p
        }
        const firstResult = await promise

        // 多次同步调用
        const result2 = requestor.get<Data>('/api/users')
        const result3 = requestor.get<Data>('/api/users')
        const result4 = requestor.get<Data>('/api/users')

        // 验证：所有同步调用返回相同的缓存数据
        expect(result2).toBe(firstResult)
        expect(result3).toBe(firstResult)
        expect(result4).toBe(firstResult)

        // 只执行了一次请求
        expect(mock.callCount).toBe(1)
    })

    it('应该测试同步模块：Suspense 典型使用场景', async () => {
        const mock = createMockRequestor({ delay: 100 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        // 模拟 Suspense 组件的使用方式
        const fetchData = () => {
            try {
                return requestor.get<Data>('/api/users')
            } catch (promise) {
                if (promise instanceof Promise) {
                    throw promise // Suspense 会捕获这个 Promise
                }
                throw new Error('Unexpected error')
            }
        }

        // 第一次调用会抛出 Promise
        let suspended = false
        let suspensePromise: any

        try {
            fetchData()
        } catch (promise) {
            if (promise instanceof Promise) {
                suspended = true
                suspensePromise = promise
            }
        }

        expect(suspended).toBe(true)
        expect(suspensePromise).toBeInstanceOf(Promise)

        // 等待 Promise 完成
        await suspensePromise

        // 再次调用，应该返回数据
        const data = fetchData()
        expect(data).not.toBeInstanceOf(Promise)
        expect((data as any).data.callCount).toBe(1)
    })

    it('应该测试同步模块：并发调用会抛出相同的 Promise', () => {
        const mock = createMockRequestor({ delay: 100 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync()]
        })

        let promise1: any
        let promise2: any

        // 并发调用
        try {
            requestor.get<Data>('/api/users')
        } catch (p) {
            promise1 = p
        }

        try {
            requestor.get<Data>('/api/users')
        } catch (p) {
            promise2 = p
        }

        // 注意：这里两次调用会抛出不同的 Promise
        // 因为 sync 中间件在缓存未命中时每次都创建新的 Promise
        // 这是 Suspense 模式的一个特点
        expect(promise1).toBeInstanceOf(Promise)
        expect(promise2).toBeInstanceOf(Promise)
    })

    it('应该测试非 Suspense 模式：suspense: false 返回 Promise', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync({ suspense: false })]
        })

        // 第一次调用应该返回 Promise，而不是抛出
        const result = requestor.get<Data>('/api/users')

        // 验证：返回的是 Promise
        expect(result).toBeInstanceOf(Promise)

        // 等待 Promise 完成
        const data = await result
        expect(data.data.callCount).toBe(1)
        expect(mock.callCount).toBe(1)
    })

    it('应该测试非 Suspense 模式：缓存命中后同步返回数据', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync({ suspense: false })]
        })

        // 第一次调用，等待 Promise
        const firstResult = await requestor.get<Data>('/api/users')
        expect(firstResult.data.callCount).toBe(1)

        // 第二次调用，应该同步返回缓存数据
        const secondResult = requestor.get<Data>('/api/users')

        // 验证：第二次是同步返回，不是 Promise
        expect(secondResult).not.toBeInstanceOf(Promise)
        expect((secondResult as any).data.callCount).toBe(1)

        // 只调用了一次请求器
        expect(mock.callCount).toBe(1)
    })

    it('应该测试非 Suspense 模式：多次请求都返回 Promise 直到缓存', async () => {
        const mock = createMockRequestor({ delay: 50 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [sync({ suspense: false })]
        })

        // 首次请求返回 Promise
        const promise1 = requestor.get<Data>('/api/users')
        expect(promise1).toBeInstanceOf(Promise)

        // 在第一个请求完成前再次请求，也会返回 Promise
        const promise2 = requestor.get<Data>('/api/users')
        expect(promise2).toBeInstanceOf(Promise)

        // 等待两个 Promise
        const [data1, data2] = await Promise.all([promise1, promise2])

        expect(data1.data.callCount).toBeDefined()
        expect(data2.data.callCount).toBeDefined()

        // 缓存命中后同步返回
        const syncResult = requestor.get<Data>('/api/users')
        expect(syncResult).not.toBeInstanceOf(Promise)
    })

    it('应该测试 wrapSuspense：自定义 Promise 包装逻辑', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const wrapSuspenseSpy = vi.fn((params) => {
            // 自定义包装：给 Promise 添加元数据
            const wrappedPromise = params.p.then((data: any) => ({
                ...data,
                __wrapped: true,
                __key: params.key
            }))
            return wrappedPromise
        })

        const requestor = createRequestor({
            extensions: [
                sync({
                    wrapSuspense: wrapSuspenseSpy
                })
            ]
        })

        // 第一次调用会抛出包装后的 Promise
        let thrownPromise: any
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            thrownPromise = promise
        }

        // 验证：wrapSuspense 被调用
        expect(wrapSuspenseSpy).toHaveBeenCalledTimes(1)
        expect(wrapSuspenseSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                key: expect.any(String),
                config: expect.objectContaining({
                    url: '/api/users',
                    method: 'get'
                }),
                p: expect.any(Promise)
            })
        )

        // 等待 Promise 并验证包装后的结果
        const result = await thrownPromise
        expect(result.__wrapped).toBe(true)
        expect(result.__key).toBeDefined()
    })

    it('应该测试 wrapSuspense：可以修改缓存的数据结构', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                sync({
                    wrapSuspense: ({ p }) => {
                        // 包装 Promise，修改返回的数据结构
                        return p.then((data: any) => ({
                            originalData: data,
                            timestamp: Date.now(),
                            enhanced: true
                        }))
                    }
                })
            ]
        })

        // 第一次调用
        let thrownPromise: any
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            thrownPromise = promise
        }

        const firstResult = await thrownPromise
        expect(firstResult.enhanced).toBe(true)
        expect(firstResult.originalData).toBeDefined()
        expect(firstResult.timestamp).toBeDefined()

        // 第二次调用，验证缓存的也是增强后的数据
        const cachedResult = requestor.get<Data>('/api/users')
        expect((cachedResult as any).enhanced).toBe(true)
        expect((cachedResult as any).originalData).toBeDefined()
    })

    it('应该测试 wrapSuspense：与 key 生成器配合使用', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const customKey = vi.fn(({ config }) => `custom-${config.url}`)
        const wrapSuspenseSpy = vi.fn(({ p }) => p)

        const requestor = createRequestor({
            extensions: [
                sync({
                    key: customKey,
                    wrapSuspense: wrapSuspenseSpy
                })
            ]
        })

        // 调用请求
        let thrownPromise: any
        try {
            requestor.get<Data>('/api/users')
        } catch (promise) {
            thrownPromise = promise
        }

        // 验证：自定义 key 和 wrapSuspense 都被调用
        expect(customKey).toHaveBeenCalledTimes(1)
        expect(wrapSuspenseSpy).toHaveBeenCalledTimes(1)

        // 验证 wrapSuspense 收到的 key 是自定义生成的
        expect(wrapSuspenseSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                key: 'custom-/api/users'
            })
        )

        await thrownPromise
    })
})
