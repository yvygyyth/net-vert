import { describe, it, expect, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { idempotent } from '../requests'

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

describe('幂等性模块测试', () => {
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
})

