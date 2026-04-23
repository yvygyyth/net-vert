import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    inject,
    useRequestor,
    createRequestor,
    cache,
    retry,
    idempotent,
    concurrent
} from '../../dist/index'

/**
 * 打包产物功能测试
 *
 * 测试库的所有导出功能是否正常工作
 * 注意：需要先运行 pnpm build 生成 dist 目录
 *
 * 这些测试通过验证源码功能来确保打包产物的正确性
 */
describe('打包产物功能测试', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('应该能够从主入口正确导出所有 API', () => {
        // 验证核心 API
        expect(inject).toBeDefined()
        expect(typeof inject).toBe('function')

        expect(useRequestor).toBeDefined()
        expect(typeof useRequestor).toBe('function')

        expect(createRequestor).toBeDefined()
        expect(typeof createRequestor).toBe('function')

        // 验证中间件
        expect(cache).toBeDefined()
        expect(typeof cache).toBe('function')

        expect(retry).toBeDefined()
        expect(typeof retry).toBe('function')

        expect(idempotent).toBeDefined()
        expect(typeof idempotent).toBe('function')

        expect(concurrent).toBeDefined()
        expect(typeof concurrent).toBe('function')

    })

    it('应该能够正常使用基本功能', async () => {
        // 创建一个简单的 mock 请求器
        const mockRequestor = vi.fn(async () => {
            return {
                code: 200,
                msg: '成功',
                data: {
                    url: '/api/test',
                    method: 'GET'
                }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建 requestor 实例
        const requestor = createRequestor()

        // 测试基本请求
        const result = await requestor.get('/api/test')

        expect(result).toBeDefined()
        expect(result.code).toBe(200)
        expect(result.data.url).toBe('/api/test')
        expect(result.data.method).toBe('GET')

        // 验证 mock 被调用
        expect(mockRequestor).toHaveBeenCalled()
    })

    it('应该能够使用中间件功能', async () => {
        let callCount = 0
        const mockRequestor = vi.fn(async () => {
            callCount++
            return {
                code: 200,
                msg: '成功',
                data: { callCount }
            }
        })

        inject(mockRequestor)

        // 创建带缓存的 requestor
        const requestor = createRequestor({
            extensions: [
                cache({ duration: 5000 })
            ]
        })

        // 第一次请求
        const result1 = await requestor.get('/api/cached')
        expect(result1.data.callCount).toBe(1)
        expect(callCount).toBe(1)

        // 第二次请求（应该命中缓存）
        const result2 = await requestor.get('/api/cached')
        expect(result2.data.callCount).toBe(1) // 还是第一次的数据
        expect(callCount).toBe(1) // 没有发起新请求

        // 验证 mock 只被调用一次
        expect(mockRequestor).toHaveBeenCalledTimes(1)
    })

    it('应该能够使用组合方法', async () => {
        let callCount = 0
        const mockRequestor = vi.fn(async () => {
            callCount++
            // 模拟延迟
            await new Promise(resolve => setTimeout(resolve, 50))
            return {
                code: 200,
                msg: '成功',
                data: { callCount }
            }
        })

        inject(mockRequestor)

        // 使用组合方法：缓存 + 幂等（使用默认配置）
        const requestor = createRequestor({
            extensions: [
                idempotent(),
                cache({ duration: 5000 })
            ]
        })

        // 并发请求（幂等性生效）
        const promise1 = requestor.get('/api/test')
        const promise2 = requestor.get('/api/test')

        expect(promise1).toBe(promise2) // 同一个 Promise

        const [result1, result2] = await Promise.all([promise1, promise2])

        expect(result1.data.callCount).toBe(1)
        expect(result2.data.callCount).toBe(1)
        expect(callCount).toBe(1) // 只调用了一次

        // 验证 mock 只被调用一次
        expect(mockRequestor).toHaveBeenCalledTimes(1)
    })

    it('应该能够组合多个中间件', async () => {
        let callCount = 0
        const mockRequestor = vi.fn(async () => {
            callCount++
            // 第一次失败，后续成功
            if (callCount === 1) {
                throw new Error('网络错误')
            }
            return {
                code: 200,
                msg: '成功',
                data: { callCount }
            }
        })

        inject(mockRequestor)

        // 组合多个中间件
        const requestor = createRequestor({
            extensions: [
                idempotent(),
                cache({ duration: 3000 }),
                retry({ retries: 2, delay: 10 })
            ]
        })

        // 第一次请求会失败并重试
        const result1 = await requestor.get('/api/complex')
        expect(result1.code).toBe(200)
        expect(result1.data.callCount).toBe(2) // 失败1次 + 成功1次
        expect(callCount).toBe(2)

        // 第二次请求命中缓存
        const result2 = await requestor.get('/api/complex')
        expect(result2.data.callCount).toBe(2) // 还是之前的数据
        expect(callCount).toBe(2) // 没有新请求

        // 验证总共调用2次（第一次失败，重试成功）
        expect(mockRequestor).toHaveBeenCalledTimes(2)
    })
})
