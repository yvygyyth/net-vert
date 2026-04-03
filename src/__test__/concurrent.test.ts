import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { concurrent } from '../requests'
import { createMockRequestor, type Data } from './test-utils'

describe('并发模块测试', () => {
    beforeEach(() => {
        // 重置所有 mock
        vi.clearAllMocks()
    })

    it('应该限制并发数量', async () => {
        // 追踪同时运行的请求数量
        let currentRunning = 0
        let maxRunning = 0

        const { mockRequestor } = createMockRequestor({ delay: 100 })
        
        const mockRequestorWithTracking = vi.fn(async (config) => {
            currentRunning++
            maxRunning = Math.max(maxRunning, currentRunning)
            
            const result = await mockRequestor(config)
            
            currentRunning--
            return result
        })

        inject(mockRequestorWithTracking)


        const concurrentMiddleware = concurrent({ parallelCount: 2 })

        
        // 设置并发数为 2
        const requestor = createRequestor({
            extensions: [
                concurrentMiddleware
            ]
        })

        // 同时发起 6 个请求
        const promises = Array.from({ length: 6 }, (_, i) => 
            requestor.get<Data>(`/api/test-${i}`)
        )

        await Promise.all(promises)

        // 验证最大并发数不超过 2
        expect(maxRunning).toBeLessThanOrEqual(2)
        expect(maxRunning).toBeGreaterThan(0)
    })

    it('应该按顺序执行所有任务', async () => {
        const { mockRequestor } = createMockRequestor({ delay: 50 })
        inject(mockRequestor)

        const requestor = createRequestor({
            extensions: [
                concurrent({ parallelCount: 3 })
            ]
        })

        const results: number[] = []
        const promises = Array.from({ length: 5 }, (_, i) => 
            requestor.get<Data>(`/api/test-${i}`)
                .then(() => results.push(i))
        )

        await Promise.all(promises)

        // 验证所有任务都执行了
        expect(results.length).toBe(5)
        expect(results.sort()).toEqual([0, 1, 2, 3, 4])
    })

    it('应该正确处理任务失败的情况', async () => {
        const { mockRequestor } = createMockRequestor({
            delay: 50,
            shouldFail: (count) => count === 2 // 第 2 个请求失败
        })
        inject(mockRequestor)

        const requestor = createRequestor({
            extensions: [
                concurrent({ parallelCount: 2 })
            ]
        })

        const promises = Array.from({ length: 4 }, (_, i) => 
            requestor.get<Data>(`/api/test-${i}`)
                .then(res => ({ success: true as const, data: res }))
                .catch((err: Error) => ({ success: false as const, error: err.message }))
        )

        const results = await Promise.all(promises)

        // 验证有一个失败，其他都成功
        const failed = results.filter(r => !r.success)
        const succeeded = results.filter(r => r.success)

        expect(failed.length).toBe(1)
        expect(succeeded.length).toBe(3)
    })

    it('应该使用自定义 ID 创建器', async () => {
        const { mockRequestor } = createMockRequestor({ delay: 50 })
        inject(mockRequestor)

        const customIds: (string | number)[] = []
        const requestor = createRequestor({
            extensions: [
                concurrent({
                    parallelCount: 2,
                    createId: ({ config }) => {
                        const id = `custom-${config.url}`
                        customIds.push(id)
                        return id
                    }
                })
            ]
        })

        const promises = Array.from({ length: 3 }, (_, i) => 
            requestor.get<Data>(`/api/test-${i}`)
        )

        await Promise.all(promises)

        // 验证自定义 ID 被正确创建
        expect(customIds.length).toBe(3)
        expect(customIds[0]).toBe('custom-/api/test-0')
        expect(customIds[1]).toBe('custom-/api/test-1')
        expect(customIds[2]).toBe('custom-/api/test-2')
    })

    it('应该在高并发下稳定工作', async () => {
        const { mockRequestor } = createMockRequestor({ delay: 20 })
        inject(mockRequestor)

        const requestor = createRequestor({
            extensions: [
                concurrent({ parallelCount: 5 })
            ]
        })

        // 发起 20 个并发请求
        const promises = Array.from({ length: 20 }, (_, i) => 
            requestor.get<Data>(`/api/test-${i}`)
        )

        const startTime = Date.now()
        const results = await Promise.all(promises)
        const endTime = Date.now()

        // 验证所有请求都成功
        expect(results.length).toBe(20)
        results.forEach(result => {
            expect(result.code).toBe(200)
        })

        // 验证执行时间符合预期（20个请求，并发5，每批20ms，至少需要4批）
        const expectedMinTime = Math.ceil(20 / 5) * 20
        expect(endTime - startTime).toBeGreaterThanOrEqual(expectedMinTime - 10) // 允许 10ms 误差
    })
})
