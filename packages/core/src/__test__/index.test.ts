import { describe, it, expect, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { retry, idempotent } from '../requests'

interface Response<T = any> {
    code: number
    msg: string
    data: T
}

interface Data {
    url: string
    method: string
    data: any
}


describe('net-vert 注入和调用测试', () => {
    it('应该测试请求幂等性：相同请求返回同一个Promise实例', async () => {
        // 定义一个模拟的异步请求函数，带延迟
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 100))
            
            return {
                code: 200,
                msg: '请求成功',
                data: {
                    url: config.url,
                    method: config.method,
                    data: config.data,
                    callCount
                }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带幂等性扩展的请求器
        const requestor = createRequestor({
            extensions: [
                idempotent()
            ]
        })

        // 发起两次相同的GET请求
        const promise1 = requestor.get<Data>('/api/users', {
            params: { id: 1 }
        })
        
        const promise2 = requestor.get<Data>('/api/users', {
            params: { id: 1 }
        })

        // 🔑 关键测试点：两个Promise应该是同一个实例
        console.log('\n🔍 检查Promise引用:')
        console.log('  - promise1 === promise2:', promise1 === promise2)
        expect(promise1).toBe(promise2) // 使用 toBe 检查引用相等性
        
        // 等待Promise完成
        const [result1, result2] = await Promise.all([promise1, promise2])

        // 验证结果相同
        console.log('\n📊 结果验证:')
        console.log('  - result1:', result1)
        console.log('  - result2:', result2)
        expect(result1).toEqual(result2)

        // 验证底层请求器只被调用一次
        console.log('\n📞 调用次数验证:')
        console.log('  - mockRequestor 调用次数:', mockRequestor.mock.calls.length)
        console.log('  - 实际调用计数:', callCount)
        expect(mockRequestor).toHaveBeenCalledTimes(1)
        expect(callCount).toBe(1)

        // 发起一个不同的请求（不同参数）
        const promise3 = requestor.get<Data>('/api/users', {
            params: { id: 2 }
        })

        // 这次应该是不同的Promise
        console.log('\n🔍 检查不同请求的Promise引用:')
        console.log('  - promise1 === promise3:', promise1 === promise3)
        expect(promise1).not.toBe(promise3)

        await promise3

        // 现在应该调用了两次
        console.log('  - 总调用次数:', mockRequestor.mock.calls.length)
        expect(mockRequestor).toHaveBeenCalledTimes(2)

        console.log('\n✅ 测试通过：幂等性功能正常工作，相同请求返回同一个Promise实例')
    })

    it('应该测试请求重试：失败后自动重试直到成功', async () => {
        // 定义一个会失败几次后成功的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            // 前两次调用失败，第三次成功
            if (callCount < 3) {
                throw new Error(`请求失败 (第 ${callCount} 次尝试)`)
            }
            
            return {
                code: 200,
                msg: '请求成功',
                data: {
                    url: config.url,
                    method: config.method,
                    callCount
                }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带重试扩展的请求器
        const requestor = createRequestor({
            extensions: [
                retry({
                    retries: 3,  // 最多重试3次
                    delay: 50    // 每次重试延迟50ms
                })
            ]
        })

        // 发起请求
        const startTime = Date.now()
        const result = await requestor.get<Data>('/api/users')
        const duration = Date.now() - startTime

        // 验证结果
        console.log('\n📊 结果验证:')
        console.log('  - result:', result)
        console.log('  - 总调用次数:', callCount)
        console.log('  - 耗时:', duration, 'ms')
        
        expect(result.data.callCount).toBe(3)
        expect(callCount).toBe(3)
        expect(mockRequestor).toHaveBeenCalledTimes(3)
        
        // 验证有延迟（至少100ms，因为有2次重试，每次50ms）
        expect(duration).toBeGreaterThanOrEqual(100)

        console.log('\n✅ 测试通过：重试功能正常工作，失败后自动重试')
    })

    it('应该测试请求重试：达到最大重试次数后抛出错误', async () => {
        // 定义一个始终失败的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            throw new Error(`请求失败 (第 ${callCount} 次尝试)`)
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带重试扩展的请求器
        const requestor = createRequestor({
            extensions: [
                retry({
                    retries: 2,  // 最多重试2次
                    delay: 10    // 每次重试延迟10ms
                })
            ]
        })

        // 发起请求，预期会失败
        console.log('\n🚫 测试请求失败场景:')
        try {
            await requestor.get<Data>('/api/users')
            // 如果没有抛出错误，测试失败
            expect.fail('应该抛出错误')
        } catch (error: any) {
            console.log('  - 捕获到错误:', error.message)
            console.log('  - 总调用次数:', callCount)
            
            // 验证：初始调用1次 + 重试2次 = 总共3次
            expect(callCount).toBe(3)
            expect(mockRequestor).toHaveBeenCalledTimes(3)
            expect(error.message).toContain('请求失败')
        }

        console.log('\n✅ 测试通过：达到最大重试次数后正确抛出错误')
    })

    it('应该测试请求重试：使用指数退避延迟策略', async () => {
        // 定义一个会失败几次后成功的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            // 前3次调用失败
            if (callCount < 4) {
                throw new Error(`请求失败 (第 ${callCount} 次尝试)`)
            }
            
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带指数退避重试策略的请求器
        const requestor = createRequestor({
            extensions: [
                retry({
                    retries: 4,
                    // 指数退避：100ms、200ms、400ms、800ms
                    delay: ({ attempt }) => Math.pow(2, attempt) * 100
                })
            ]
        })

        // 发起请求
        const startTime = Date.now()
        const result = await requestor.get<Data>('/api/users')
        const duration = Date.now() - startTime

        // 验证结果
        console.log('\n📊 结果验证:')
        console.log('  - 总调用次数:', callCount)
        console.log('  - 耗时:', duration, 'ms')
        
        expect(callCount).toBe(4)
        // 预期延迟：100 + 200 + 400 = 700ms
        expect(duration).toBeGreaterThanOrEqual(700)

        console.log('\n✅ 测试通过：指数退避延迟策略正常工作')
    })

    it('应该测试请求重试：自定义重试条件', async () => {
        // 定义一个返回不同错误代码的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            if (callCount === 1) {
                // 第一次：服务器错误（应该重试）
                throw { code: 500, message: '服务器错误' }
            } else if (callCount === 2) {
                // 第二次：网络超时（应该重试）
                throw { code: 504, message: '网关超时' }
            } else if (callCount === 3) {
                // 第三次：客户端错误（不应该重试）
                throw { code: 400, message: '参数错误' }
            }
            
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带自定义重试条件的请求器
        const requestor = createRequestor({
            extensions: [
                retry({
                    retries: 5,
                    delay: 10,
                    // 只重试服务器错误（5xx），不重试客户端错误（4xx）
                    retryCondition: ({ lastResponse }) => {
                        const errorCode = lastResponse?.code || 0
                        return errorCode >= 500
                    }
                })
            ]
        })

        // 发起请求
        console.log('\n🚫 测试自定义重试条件:')
        try {
            await requestor.get<Data>('/api/users')
            expect.fail('应该抛出错误')
        } catch (error: any) {
            console.log('  - 捕获到错误:', error.message)
            console.log('  - 总调用次数:', callCount)
            
            // 验证：遇到400错误后不再重试
            expect(callCount).toBe(3)
            expect(error.code).toBe(400)
        }

        console.log('\n✅ 测试通过：自定义重试条件正常工作')
    })

    it('应该测试请求重试：成功的请求不重试', async () => {
        // 定义一个立即成功的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            console.log(`第 ${callCount} 次调用请求器`)
            
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带重试扩展的请求器
        const requestor = createRequestor({
            extensions: [
                retry({
                    retries: 3,
                    delay: 50
                })
            ]
        })

        // 发起请求
        const startTime = Date.now()
        const result = await requestor.get<Data>('/api/users')
        const duration = Date.now() - startTime

        // 验证结果
        console.log('\n📊 结果验证:')
        console.log('  - result:', result)
        console.log('  - 总调用次数:', callCount)
        console.log('  - 耗时:', duration, 'ms')
        
        // 验证只调用一次
        expect(callCount).toBe(1)
        expect(mockRequestor).toHaveBeenCalledTimes(1)
        // 验证没有延迟（应该很快完成）
        expect(duration).toBeLessThan(50)

        console.log('\n✅ 测试通过：成功的请求不会触发重试')
    })
})

