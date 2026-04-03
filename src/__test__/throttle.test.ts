import { describe, it, expect, beforeEach, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { throttle } from '../requests'
import { createMockRequestor } from './test-utils'

describe('throttle 节流中间件', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('基本功能：单个请求正常执行', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [throttle({ interval: 100 })]
        })

        const result = await requestor.get('/api/test')

        expect(result.data.url).toBe('/api/test')
        expect(mock.callCount).toBe(1)
    })

    it('核心功能：按间隔执行请求', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [throttle({ interval: 100 })]
        })

        const start = Date.now()

        // 快速发起 3 个请求
        await Promise.all([requestor.get('/api/1'), requestor.get('/api/2'), requestor.get('/api/3')])

        const duration = Date.now() - start

        // 3个请求至少需要 200ms (0 + 100 + 100)
        expect(duration).toBeGreaterThanOrEqual(190)
        expect(mock.callCount).toBe(3)
    })

    it('超时功能：超时自动拒绝', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                throttle({
                    interval: 100,
                    timeout: 120 // 超时时间略大于1个间隔
                })
            ]
        })

        // 发起多个请求
        const results = await Promise.allSettled([
            requestor.get('/api/1'),
            requestor.get('/api/2'),
            requestor.get('/api/3'),
            requestor.get('/api/4'),
            requestor.get('/api/5')
        ])

        const successCount = results.filter((r) => r.status === 'fulfilled').length
        const failedCount = results.filter((r) => r.status === 'rejected').length

        // 应该有成功和失败的
        expect(successCount).toBeGreaterThan(0)
        expect(failedCount).toBeGreaterThan(0)
        // 实际执行的请求数应该少于总数
        expect(mock.callCount).toBeLessThan(5)
    })

    it('超时=0：立即拒绝排队请求', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [
                throttle({
                    interval: 100,
                    timeout: 0
                })
            ]
        })

        const results = await Promise.allSettled([
            requestor.get('/api/1'),
            requestor.get('/api/2'),
            requestor.get('/api/3')
        ])

        // timeout=0时，所有排队的（包括第1个）都会检查并超时
        // 但第1个在开始处理后还没等待，所以第1个可能成功
        // 实际行为：第1个立即进入处理并成功，第2、3个超时
        const successCount = results.filter((r) => r.status === 'fulfilled').length
        const failedCount = results.filter((r) => r.status === 'rejected').length

        // 至少有2个超时
        expect(failedCount).toBeGreaterThanOrEqual(2)
        expect(successCount).toBeLessThanOrEqual(1)
    })

    it('无超时：所有请求都执行', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor = createRequestor({
            extensions: [throttle({ interval: 50 })] // 不设置 timeout
        })

        const results = await Promise.all(Array.from({ length: 5 }, (_, i) => requestor.get(`/api/${i}`)))

        expect(results).toHaveLength(5)
        expect(mock.callCount).toBe(5)
    })

    it('状态查询：获取队列状态', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const throttleMiddleware = throttle({ interval: 100 })
        const requestor = createRequestor({
            extensions: [throttleMiddleware]
        })

        // 初始状态
        let status = throttleMiddleware.throttler.getStatus()
        expect(status.queueLength).toBe(0)
        expect(status.isProcessing).toBe(false)

        // 发起请求后检查
        const p1 = requestor.get('/api/1')
        const p2 = requestor.get('/api/2')

        status = throttleMiddleware.throttler.getStatus()
        expect(status.isProcessing).toBe(true)

        await Promise.all([p1, p2])

        status = throttleMiddleware.throttler.getStatus()
        expect(status.queueLength).toBe(0)
    })

    it('错误处理：请求失败不影响后续', async () => {
        let count = 0
        inject(
            vi.fn(async () => {
                count++
                if (count === 2) throw new Error('失败')
                return { code: 200, data: { success: true } }
            })
        )

        const requestor = createRequestor({
            extensions: [throttle({ interval: 50 })]
        })

        const r1 = await requestor.get('/api/1')
        await expect(requestor.get('/api/2')).rejects.toThrow('失败')
        const r3 = await requestor.get('/api/3')

        expect(r1.data.success).toBe(true)
        expect(r3.data.success).toBe(true)
        expect(count).toBe(3)
    })

    it('独立实例：不同节流器互不影响', async () => {
        const mock = createMockRequestor({ delay: 0 })
        inject(mock.mockRequestor)

        const requestor1 = createRequestor({
            extensions: [throttle({ interval: 100 })]
        })

        const requestor2 = createRequestor({
            extensions: [throttle({ interval: 100 })]
        })

        const start = Date.now()

        // 两个独立节流器并行工作
        await Promise.all([
            requestor1.get('/api/1'),
            requestor1.get('/api/2'),
            requestor2.get('/api/3'),
            requestor2.get('/api/4')
        ])

        const duration = Date.now() - start

        // 并行执行，总时间约 100ms，不是 400ms
        expect(duration).toBeLessThan(200)
        expect(mock.callCount).toBe(4)
    })
})
