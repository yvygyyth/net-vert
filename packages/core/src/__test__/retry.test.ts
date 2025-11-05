import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { retry } from '../requests'
import { createMockRequestor, createFailNTimesMockRequestor, type Response, type Data } from './test-utils'

describe('重试模块测试', () => {
    beforeEach(() => {
        // 清空所有注入的请求器
        inject(null as any)
    })

    it('应该在失败后重试并最终成功', async () => {
        // 创建一个失败 2 次后成功的 mock 请求器
        const mockResult = createFailNTimesMockRequestor(2, { delay: 10 })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0 })]
        })

        const response = await requestor.get<Response<Data>>('/api/test')
        
        // 应该调用 3 次（前 2 次失败，第 3 次成功）
        expect(mockResult.callCount).toBe(3)
        expect(response.code).toBe(200)
        expect(response.data.callCount).toBe(3)
    })

    it('应该在达到最大重试次数后抛出错误', async () => {
        // 创建一个总是失败的 mock 请求器
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0 })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow('请求失败')

        // 应该调用 4 次（初始 1 次 + 重试 3 次）
        expect(mockResult.callCount).toBe(4)
    })

    it('应该支持自定义重试次数', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 5, delay: 0 })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()

        // 应该调用 6 次（初始 1 次 + 重试 5 次）
        expect(mockResult.callCount).toBe(6)
    })

    it('应该在第一次请求成功时不重试', async () => {
        const mockResult = createMockRequestor({ delay: 10 })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0 })]
        })

        const response = await requestor.get<Response<Data>>('/api/test')

        // 只应该调用 1 次
        expect(mockResult.callCount).toBe(1)
        expect(response.code).toBe(200)
    })

    it('应该支持固定延迟重试', async () => {
        const mockResult = createFailNTimesMockRequestor(2, { delay: 10 })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 100 })]
        })

        const startTime = Date.now()
        await requestor.get<Response<Data>>('/api/test')
        const endTime = Date.now()

        // 应该有 2 次重试延迟（每次 100ms）
        // 加上 3 次请求的延迟（每次 10ms）
        // 总时间应该 >= 200ms（2 * 100）
        expect(endTime - startTime).toBeGreaterThanOrEqual(200)
        expect(mockResult.callCount).toBe(3)
    })

    it('应该支持动态延迟策略（指数退避）', async () => {
        const mockResult = createFailNTimesMockRequestor(2, { delay: 10 })
        inject(mockResult.mockRequestor)

        const delayFn = vi.fn((ctx) => {
            // 指数退避：2^attempt * 50ms
            return Math.pow(2, ctx.attempt) * 50
        })

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: delayFn })]
        })

        const startTime = Date.now()
        await requestor.get<Response<Data>>('/api/test')
        const endTime = Date.now()

        // 第 1 次失败后延迟：2^0 * 50 = 50ms
        // 第 2 次失败后延迟：2^1 * 50 = 100ms
        // 总延迟应该 >= 150ms
        expect(endTime - startTime).toBeGreaterThanOrEqual(150)
        expect(mockResult.callCount).toBe(3)
        expect(delayFn).toHaveBeenCalledTimes(2)
    })

    it('应该支持自定义重试条件', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        // 只在 5xx 错误时重试
        const retryCondition = vi.fn((ctx) => {
            const error = ctx.lastResponse as Error
            // 模拟：只有包含"500"的错误才重试
            return error.message.includes('请求失败')
        })

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0, retryCondition })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()

        // 应该调用 4 次（因为重试条件满足）
        expect(mockResult.callCount).toBe(4)
        expect(retryCondition).toHaveBeenCalled()
    })

    it('应该在重试条件不满足时立即失败', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        // 重试条件始终返回 false
        const retryCondition = vi.fn(() => false)

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0, retryCondition })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()

        // 只应该调用 1 次（因为重试条件不满足，不会重试）
        expect(mockResult.callCount).toBe(1)
        expect(retryCondition).toHaveBeenCalledTimes(1)
    })

    it('应该在最后一次重试时不调用 retryCondition', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        const retryCondition = vi.fn(() => true)

        const requestor = createRequestor({
            extensions: [retry({ retries: 2, delay: 0, retryCondition })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()

        // 应该调用 3 次请求（初始 1 次 + 重试 2 次）
        expect(mockResult.callCount).toBe(3)
        // retryCondition 应该被调用 2 次（不包括最后一次失败）
        expect(retryCondition).toHaveBeenCalledTimes(2)
    })

    it('应该正确传递 RetryContext 参数', async () => {
        const mockResult = createFailNTimesMockRequestor(1, { delay: 10 })
        inject(mockResult.mockRequestor)

        let capturedContext: any = null
        const retryCondition = vi.fn((ctx: any) => {
            if (!capturedContext) {
                capturedContext = ctx
            }
            return true
        })

        const requestor = createRequestor({
            extensions: [retry({ retries: 3, delay: 0, retryCondition })]
        })

        await requestor.post<Response<Data>>('/api/test', { test: 'data' })

        // 检查 retryCondition 的调用参数
        expect(retryCondition).toHaveBeenCalled()
        expect(capturedContext).toBeDefined()
        expect(capturedContext).toHaveProperty('config')
        expect(capturedContext).toHaveProperty('lastResponse')
        expect(capturedContext).toHaveProperty('attempt')
        expect(capturedContext.config.url).toBe('/api/test')
        expect(capturedContext.attempt).toBe(0)
    })

    it('应该支持零次重试（retries: 0）', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry({ retries: 0, delay: 0 })]
        })

        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()

        // 只应该调用 1 次（不重试）
        expect(mockResult.callCount).toBe(1)
    })

    it('应该使用默认配置（3 次重试，0ms 延迟）', async () => {
        const mockResult = createMockRequestor({
            delay: 10,
            shouldFail: () => true
        })
        inject(mockResult.mockRequestor)

        const requestor = createRequestor({
            extensions: [retry()]
        })

        const startTime = Date.now()
        await expect(requestor.get<Response<Data>>('/api/test')).rejects.toThrow()
        const endTime = Date.now()

        // 默认重试 3 次，总共 4 次调用
        expect(mockResult.callCount).toBe(4)
        // 默认延迟 0ms，所以时间应该很短（< 100ms，主要是请求延迟）
        expect(endTime - startTime).toBeLessThan(100)
    })
})

