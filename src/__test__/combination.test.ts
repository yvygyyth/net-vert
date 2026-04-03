import { describe, it, expect, beforeEach, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { cache, retry, concurrent, idempotent } from '../requests'
import { 
    createMockRequestor,
    createFailNTimesMockRequestor,
    delay,
    type Data 
} from './test-utils'

describe('功能组合测试', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 清理注入的请求器
        inject(null as any)
    })

    describe('幂等 + 缓存组合', () => {
        it('应该同时提供幂等性和缓存功能', async () => {
            const mock = createMockRequestor({ delay: 50 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    idempotent(), // 防止并发重复请求
                    cache({ duration: 5000 }) // 缓存5秒
                ]
            })

            // 场景1: 并发请求（幂等性生效）
            const promise1 = requestor.get<Data>('/api/users')
            const promise2 = requestor.get<Data>('/api/users')
            
            // 幂等性确保返回同一个 Promise
            expect(promise1).toBe(promise2)
            
            const [result1, result2] = await Promise.all([promise1, promise2])
            
            // 只调用了一次
            expect(mock.callCount).toBe(1)
            expect(result1.data.callCount).toBe(1)
            expect(result2.data.callCount).toBe(1)

            // 场景2: 等待一段时间后再次请求（缓存生效）
            await delay(100)
            const result3 = await requestor.get<Data>('/api/users')
            
            // 缓存命中，callCount 仍然是 1
            expect(mock.callCount).toBe(1)
            expect(result3.data.callCount).toBe(1)
        })

        it('应该在缓存过期后重新请求并提供幂等保护', async () => {
            const mock = createMockRequestor({ delay: 50 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    idempotent(),
                    cache({ duration: 200 }) // 200ms 缓存
                ]
            })

            // 第一次请求
            await requestor.get<Data>('/api/users')
            expect(mock.callCount).toBe(1)

            // 等待缓存过期
            await delay(250)

            // 并发请求（缓存已过期，幂等性生效）
            const promise1 = requestor.get<Data>('/api/users')
            const promise2 = requestor.get<Data>('/api/users')
            
            expect(promise1).toBe(promise2)
            
            await Promise.all([promise1, promise2])
            
            // 缓存过期后重新请求，总共2次
            expect(mock.callCount).toBe(2)
        })
    })

    describe('并发 + 重试组合', () => {
        it('应该限制并发数量并在失败时重试', async () => {
            let requestCount = 0
            const mock = createMockRequestor({
                delay: 50,
                shouldFail: () => {
                    requestCount++
                    // 前3个请求失败
                    return requestCount <= 3
                }
            })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    concurrent({ parallelCount: 2 }), // 最多2个并发
                    retry({ retries: 2, delay: 10 }) // 失败重试2次
                ]
            })

            // 发起5个请求
            const promises = Array.from({ length: 5 }, (_, i) => 
                requestor.get<Data>(`/api/test-${i}`)
                    .catch(() => ({ error: true }))
            )

            await Promise.all(promises)

            // 验证：至少进行了重试（总请求数 > 5）
            expect(mock.callCount).toBeGreaterThan(5)
        })

        it('应该对并发池中的每个请求独立重试', async () => {
            const mock = createFailNTimesMockRequestor(1, { delay: 30 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    concurrent({ parallelCount: 2 }),
                    retry({ retries: 2, delay: 0 })
                ]
            })

            // 发起3个请求，每个都会失败1次然后成功
            const promises = Array.from({ length: 3 }, (_, i) => 
                requestor.get<Data>(`/api/test-${i}`)
            )

            const results = await Promise.all(promises)

            // 每个请求失败1次后成功，总共 3 * 2 = 6 次调用
            expect(mock.callCount).toBe(6)
            results.forEach(result => {
                expect(result.code).toBe(200)
            })
        })
    })

    describe('多模块组合', () => {
        it('应该正确组合使用多个模块：幂等 + 缓存 + 重试 + 并发', async () => {
            let requestCount = 0
            const mock = createMockRequestor({
                delay: 50,
                shouldFail: (count) => {
                    requestCount++
                    // 第1个请求失败一次
                    return count === 1
                }
            })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    idempotent(),                         // 1. 防止并发重复
                    cache({ duration: 3000 }),            // 2. 缓存3秒
                    retry({ retries: 2, delay: 10 }),     // 3. 失败重试
                    concurrent({ parallelCount: 3 })      // 4. 限制并发
                ]
            })

            // 场景1: 并发请求（幂等性生效）
            const promise1 = requestor.get<Data>('/api/users')
            const promise2 = requestor.get<Data>('/api/users')
            
            expect(promise1).toBe(promise2)
            const result1 = await promise1
            
            // 第一次失败，重试后成功
            expect(result1.code).toBe(200)
            expect(mock.callCount).toBe(2) // 失败1次 + 成功1次

            // 场景2: 缓存生效
            await delay(100)
            const result2 = await requestor.get<Data>('/api/users')
            expect(mock.callCount).toBe(2) // 缓存命中，没有新请求
            expect(result2.data.callCount).toBe(2) // 还是第一次请求的数据

            // 场景3: 发起多个不同的请求（测试并发控制）
            const startTime = Date.now()
            const differentPromises = []
            
            for (let i = 0; i < 4; i++) {
                differentPromises.push(requestor.get<Data>(`/api/test-${i}`))
            }

            await Promise.all(differentPromises)
            const endTime = Date.now()

            // 验证并发限制（4个请求，并发3，至少需要2批次）
            // 每批至少50ms，所以总时间应该 >= 80ms
            expect(endTime - startTime).toBeGreaterThanOrEqual(80)

            // 总请求数：第一个用户请求2次（1次失败+1次成功） + 4个新请求 = 6次
            expect(mock.callCount).toBe(6)
        })

        it('应该在复杂场景下保持功能的正确性', async () => {
            const mock = createMockRequestor({ delay: 30 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    idempotent(),
                    cache({ duration: 500 }),
                    retry({ retries: 1, delay: 0 }),
                    concurrent({ parallelCount: 2 })
                ]
            })

            // 步骤1: 并发请求（幂等性生效）
            const promises1 = []
            for (let i = 0; i < 3; i++) {
                promises1.push(requestor.get<Data>('/api/data'))
            }
            
            const results1 = await Promise.all(promises1)
            
            // 幂等性确保只发起一次请求
            expect(mock.callCount).toBe(1)
            // 所有结果都是同一个数据
            expect(results1[0]).toBe(results1[1])
            expect(results1[1]).toBe(results1[2])

            // 步骤2: 再次请求（缓存生效）
            const cachedResult1 = await requestor.get<Data>('/api/data')
            const cachedResult2 = await requestor.get<Data>('/api/data')
            
            expect(cachedResult1).toBe(cachedResult2)
            expect(mock.callCount).toBe(1) // 仍然只有1次请求

            // 步骤3: 等待缓存过期
            await delay(550)

            // 步骤4: 缓存过期后的并发请求
            const promises2 = []
            for (let i = 0; i < 5; i++) {
                promises2.push(requestor.get<Data>('/api/data'))
            }

            const results2 = await Promise.all(promises2)
            
            // 幂等性确保缓存过期后的并发请求也只发起一次
            expect(mock.callCount).toBe(2)

            // 步骤5: 验证新的缓存数据
            expect(results2[0].data.callCount).toBe(2)
            expect(results2[0]).toBe(results2[1])
        })

        it('应该正确处理不同请求的独立性', async () => {
            const mock = createMockRequestor({ delay: 30 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    idempotent(),
                    cache({ duration: 1000 }),
                    retry({ retries: 1, delay: 0 }),
                    concurrent({ parallelCount: 2 })
                ]
            })

            // 对不同URL的请求应该独立处理
            const urls = ['/api/users', '/api/posts', '/api/comments']
            const allPromises: Promise<any>[] = []

            // 第一轮：每个URL发起多次并发请求
            urls.forEach(url => {
                for (let i = 0; i < 3; i++) {
                    allPromises.push(requestor.get<Data>(url))
                }
            })

            await Promise.all(allPromises)

            // 每个URL只请求一次，总共3次（幂等性生效）
            expect(mock.callCount).toBe(3)

            // 第二轮：获取每个URL的缓存
            const cachedPromises: Promise<any>[] = []
            urls.forEach(url => {
                cachedPromises.push(requestor.get<Data>(url))
                cachedPromises.push(requestor.get<Data>(url))
            })

            await Promise.all(cachedPromises)

            // 仍然只有3次请求（缓存生效）
            expect(mock.callCount).toBe(3)
        })
    })
})

