import { describe, it, expect, beforeEach, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { sync, retry } from '../requests'
import { 
    createMockRequestor,
    createFailNTimesMockRequestor,
    delay
} from './test-utils'

describe('同步 + 重试组合测试', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        inject(null as any)
    })

    describe('情况1: 同步在前，重试在后', () => {
        it('第一次请求失败时，应该能够通过重试机制恢复', async () => {
            // 创建一个会失败2次然后成功的请求器
            const mock = createFailNTimesMockRequestor(2, { delay: 50 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    sync(),        // 同步在前
                    retry({ retries: 3, delay: 10 }) // 重试在后
                ]
            })
            let error: any

            // 第一次调用（会抛出 Promise）
            try {
                requestor.get('/api/test')
            } catch (e) {
                error = e
            }

            // sync 会抛出一个 Promise
            expect(error).toBeInstanceOf(Promise)
            console.log('第一次调用抛出的 Promise:', error)

            // 等待 Promise 完成
            const data = await error
            console.log('Promise resolve 的数据:', data)
            console.log('实际调用次数:', mock.callCount)

            // 验证数据
            expect(data).toBeDefined()
            expect(data.code).toBe(200)
            
            // 应该失败2次，第3次成功，总共3次
            expect(mock.callCount).toBe(3)
        })

        it('第二次请求应该直接从缓存获取，不会触发重试', async () => {
            const mock = createMockRequestor({ delay: 50 })
            inject(mock.mockRequestor)

            const requestor = createRequestor({
                extensions: [
                    sync(),
                    retry({ retries: 2, delay: 10 })
                ]
            })

            // 第一次请求
            let error1: any
            try {
                requestor.get('/api/test')
            } catch (e) {
                error1 = e
            }

            const data1 = await error1
            expect(data1.code).toBe(200)
            const callCountAfterFirst = mock.callCount

            // 第二次请求（应该直接从缓存返回）
            const result2 = requestor.get('/api/test')

            console.log('第二次请求结果:', result2)
            console.log('第一次后的调用次数:', callCountAfterFirst)
            console.log('第二次后的调用次数:', mock.callCount)

            // 验证第二次直接返回了缓存数据
            expect(result2).toBeDefined()
            expect(result2.code).toBe(200)
            
            // 调用次数不变，证明使用了缓存
            expect(mock.callCount).toBe(callCountAfterFirst)
        })

    })
})

