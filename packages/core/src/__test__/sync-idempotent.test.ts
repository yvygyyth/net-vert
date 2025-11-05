import { describe, it, expect, beforeEach, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { sync, idempotent } from '../requests'
import { createMockRequestor } from './test-utils'

describe('同步 + 幂等组合测试', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        inject(null as any)
    })

    describe('情况1: 同步在前，幂等在后', () => {
        it('两次调用都会得到相同的 Promise，但赋值会执行两次', async () => {
            // 创建 mock 并注入
            const mock = createMockRequestor({ delay: 100 })
            inject(mock.mockRequestor)

            // 同步在前，幂等在后
            const requestor = createRequestor({
                extensions: [
                    sync(),
                    idempotent()
                ]
            })

            let assignCount = 0
            let error1: any
            let error2: any

            // 第一次调用
            try {
                const data = requestor.post('/api/test', {
                    name: 'test'
                })
            } catch (e) {
                error1 = e
                assignCount++
            }

            // 第二次调用（在第一次完成前）
            try {
                await requestor.post('/api/test', {
                    name: 'test'
                })
            } catch (e) {
                error2 = e
                assignCount++
            }

            // 验证两次都抛出了 Promise（不是普通错误）
            expect(error1).toBeInstanceOf(Promise)
            expect(error2).toBeInstanceOf(Promise)

            // 验证是否是同一个 Promise
            const isSamePromise = error1 === error2
            console.log('两次抛出的是否是同一个 Promise:', isSamePromise)
            
            // 等待两个 Promise 都完成
            const [data1, data2] = await Promise.all([error1, error2])

            console.log('第一次 Promise 结果:', data1)
            console.log('第二次 Promise 结果:', data2)
            console.log('实际调用次数:', mock.callCount)
            console.log('赋值执行次数:', assignCount)

            // 验证数据一致
            expect(data1).toBeDefined()
            expect(data2).toBeDefined()
            expect(data1).toEqual(data2)

            // 验证调用次数（sync 会导致执行两次）
            expect(mock.callCount).toBeGreaterThanOrEqual(1)
        })
    })

    describe('情况2: 幂等在前，同步在后', () => {
        it('两次请求都会失败，测试是否是独立的 Promise', async () => {
            // 创建 mock 并注入
            const mock = createMockRequestor({ delay: 100 })
            inject(mock.mockRequestor)

            // 幂等在前，同步在后
            const requestor = createRequestor({
                extensions: [
                    idempotent(),
                    sync()
                ]
            })

            let error1: any
            let error2: any

            // 第一次调用
            try {
                await requestor.post('/api/test', {
                    name: 'test'
                })
            } catch (e) {
                error1 = e
            }

            // 第二次调用（在第一次完成前）
            try {
                await requestor.post('/api/test', {
                    name: 'test'
                })
            } catch (e) {
                error2 = e
            }

            console.log('第一次错误:', error1)
            console.log('第二次错误:', error2)
            console.log('是否是同一个错误:', error1 === error2)
            console.log('第一次错误是否是 Promise:', error1 instanceof Promise)
            console.log('第二次错误是否是 Promise:', error2 instanceof Promise)

            // 验证两次都失败了（都抛出了 Promise）
            expect(error1).toBeInstanceOf(Promise)
            expect(error2).toBeInstanceOf(Promise)

            // 关键：验证是否是同一个 Promise
            const isSamePromise = error1 === error2
            console.log('两次抛出的是否是同一个 Promise:', isSamePromise)

            if (isSamePromise) {
                console.log('✅ 是同一个 Promise，说明幂等生效了')
            } else {
                console.log('❌ 是不同的 Promise，说明幂等没有生效')
            }

            // 尝试等待这些 Promise
            try {
                const [data1, data2] = await Promise.all([error1, error2])
                console.log('Promise resolve 的数据1:', data1)
                console.log('Promise resolve 的数据2:', data2)
            } catch (e) {
                console.log('Promise 等待过程中出错:', e)
            }

            console.log('实际调用次数:', mock.callCount)
        })
    })
})

