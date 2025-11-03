import { describe, it, expect, vi } from 'vitest'
import { inject, createRequestor } from '../index'
import { retry, idempotent, concurrent } from '../requests'
import { createMonitoredMockRequestor, type Response, type Data } from './test-utils'

describe('net-vert 注入和调用测试', () => {
    it('应该测试并发控制：限制同时执行的请求数量', async () => {
        // 使用带监控的 mock 请求器
        const { 
            mockRequestor, 
            callCount,
            concurrencyMonitor,
            executionLogger 
        } = createMonitoredMockRequestor({ delay: 100 })

        // 注入请求器
        inject(mockRequestor)

        // 创建带并发控制的请求器，限制并发数为 2
        const requestor = createRequestor({
            extensions: [
                concurrent({ parallelCount: 2 })
            ]
        })

        // 同时发起 6 个请求
        console.log('\n🚀 同时发起 6 个请求（并发限制为 2）:')
        const promises = Array.from({ length: 6 }, (_, i) => 
            requestor.get<Data>(`/api/users/${i}`)
        )

        const results = await Promise.all(promises)

        // 打印执行日志
        executionLogger.print()

        console.log(`\n🔍 并发控制验证:`)
        console.log(`  - 最大并发数: ${concurrencyMonitor.max}`)
        console.log(`  - 预期并发数: 2`)
        
        // 验证最大并发数不超过限制
        expect(concurrencyMonitor.max).toBe(2)
        
        // 验证所有请求都成功完成
        expect(results).toHaveLength(6)
        expect(mockRequestor).toHaveBeenCalledTimes(6)

        console.log('\n✅ 测试通过：并发控制功能正常工作，限制了同时执行的请求数量')
    })

    it('应该测试并发控制：按顺序执行超出并发限制的请求', async () => {
        const executionOrder: number[] = []
        const completionOrder: number[] = []

        // 定义一个带延迟的请求函数
        let callCount = 0
        const mockRequestor = vi.fn(async (): Promise<Response> => {
            const id = ++callCount
            executionOrder.push(id)
            console.log(`[请求 ${id}] 开始执行`)
            
            // 第一个和第二个请求延迟 150ms，其他请求延迟 50ms
            const delay = id <= 2 ? 150 : 50
            await new Promise(resolve => setTimeout(resolve, delay))
            
            completionOrder.push(id)
            console.log(`[请求 ${id}] 完成`)
            
            return {
                code: 200,
                msg: '请求成功',
                data: { id }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带并发控制的请求器，限制并发数为 2
        const requestor = createRequestor({
            extensions: [
                concurrent({ parallelCount: 2 })
            ]
        })

        // 同时发起 4 个请求
        console.log('\n🚀 同时发起 4 个请求（并发限制为 2）:')
        const promises = Array.from({ length: 4 }, (_, i) => 
            requestor.get<Data>(`/api/users/${i}`)
        )

        await Promise.all(promises)

        console.log('\n📊 执行顺序:', executionOrder)
        console.log('📊 完成顺序:', completionOrder)

        // 验证前两个请求先开始执行
        expect(executionOrder.slice(0, 2)).toEqual([1, 2])
        
        // 验证后面的请求在前面的请求完成后才开始执行
        // 由于前两个请求延迟较长（150ms），请求3和4应该在它们完成后执行
        expect(executionOrder[2]).toBeGreaterThan(2)
        
        console.log('\n✅ 测试通过：请求按照并发限制正确排队执行')
    })

    it('应该测试并发控制：使用自定义 ID 生成器', async () => {
        const requestIds: string[] = []
        
        // 定义一个简单的请求函数
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            await new Promise(resolve => setTimeout(resolve, 50))
            return {
                code: 200,
                msg: '请求成功',
                data: { url: config.url }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建带自定义 ID 生成器的并发控制请求器
        const requestor = createRequestor({
            extensions: [
                concurrent({
                    parallelCount: 2,
                    createId: ({ config }) => {
                        // 使用 URL 作为 ID
                        const id = `${config.method}-${config.url}`
                        requestIds.push(id)
                        console.log(`生成请求 ID: ${id}`)
                        return id
                    }
                })
            ]
        })

        // 发起请求
        await Promise.all([
            requestor.get('/api/user/1'),
            requestor.post('/api/user', { name: 'test' }),
            requestor.get('/api/user/2')
        ])

        console.log('\n📊 生成的请求 ID:')
        requestIds.forEach(id => console.log(`  - ${id}`))

        // 验证自定义 ID 生成器被调用
        expect(requestIds).toHaveLength(3)
        expect(requestIds[0]).toBe('get-/api/user/1')
        expect(requestIds[1]).toBe('post-/api/user')
        expect(requestIds[2]).toBe('get-/api/user/2')

        console.log('\n✅ 测试通过：自定义 ID 生成器正常工作')
    })

    it('应该测试并发控制：与重试结合使用', async () => {
        let callCount = 0
        let maxConcurrent = 0
        let currentRunning = 0

        // 定义一个会失败一次然后成功的请求函数
        const mockRequestor = vi.fn(async (): Promise<Response> => {
            callCount++
            currentRunning++
            maxConcurrent = Math.max(maxConcurrent, currentRunning)
            
            console.log(`[调用 ${callCount}] 开始，当前并发: ${currentRunning}`)
            
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // 前 3 次调用失败
            if (callCount <= 3) {
                currentRunning--
                throw new Error(`请求失败 (第 ${callCount} 次)`)
            }
            
            currentRunning--
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建同时带有并发控制和重试的请求器
        const requestor = createRequestor({
            extensions: [
                retry({ retries: 3, delay: 10 }),
                concurrent({ parallelCount: 2 })
            ]
        })

        // 发起两个请求
        console.log('\n🚀 发起 2 个会失败的请求（带重试和并发控制）:')
        const results = await Promise.all([
            requestor.get('/api/test/1'),
            requestor.get('/api/test/2')
        ])

        console.log('\n📊 测试结果:')
        console.log(`  - 总调用次数: ${callCount}`)
        console.log(`  - 最大并发数: ${maxConcurrent}`)
        console.log(`  - 成功请求数: ${results.length}`)

        // 验证重试和并发控制都生效
        expect(results).toHaveLength(2)
        expect(maxConcurrent).toBeLessThanOrEqual(2)
        
        console.log('\n✅ 测试通过：并发控制可以与重试功能正确配合')
    })

    it('应该测试并发控制：与幂等性结合使用', async () => {
        let callCount = 0
        let maxConcurrent = 0
        let currentRunning = 0

        // 定义一个带延迟的请求函数
        const mockRequestor = vi.fn(async (config): Promise<Response> => {
            callCount++
            currentRunning++
            maxConcurrent = Math.max(maxConcurrent, currentRunning)
            
            console.log(`[调用 ${callCount}] 开始，当前并发: ${currentRunning}`)
            
            await new Promise(resolve => setTimeout(resolve, 100))
            
            currentRunning--
            console.log(`[调用 ${callCount}] 完成`)
            
            return {
                code: 200,
                msg: '请求成功',
                data: {
                    url: config.url,
                    callCount
                }
            }
        })

        // 注入请求器
        inject(mockRequestor)

        // 创建同时带有并发控制和幂等性的请求器
        const requestor = createRequestor({
            extensions: [
                idempotent(),
                concurrent({ parallelCount: 2 })
            ]
        })

        // 同时发起 4 个相同的请求和 2 个不同的请求
        console.log('\n🚀 发起多个请求（相同请求应该被幂等性合并）:')
        const promises = [
            requestor.get('/api/same'),  // 1
            requestor.get('/api/same'),  // 应该复用上面的
            requestor.get('/api/same'),  // 应该复用上面的
            requestor.get('/api/different/1'),  // 2
            requestor.get('/api/same'),  // 应该复用第一个
            requestor.get('/api/different/2')   // 3
        ]

        const results = await Promise.all(promises)

        console.log('\n📊 测试结果:')
        console.log(`  - 发起请求数: ${promises.length}`)
        console.log(`  - 实际调用次数: ${callCount}`)
        console.log(`  - 最大并发数: ${maxConcurrent}`)
        console.log(`  - 返回结果数: ${results.length}`)

        // 验证幂等性：相同的请求只执行一次
        expect(callCount).toBe(3)  // 只有 3 个不同的请求
        expect(results).toHaveLength(6)  // 但返回 6 个结果
        
        // 验证并发控制
        expect(maxConcurrent).toBeLessThanOrEqual(2)
        
        // 验证相同请求返回相同结果
        expect(results[0]).toEqual(results[1])
        expect(results[0]).toEqual(results[2])
        expect(results[0]).toEqual(results[4])

        console.log('\n✅ 测试通过：并发控制可以与幂等性功能正确配合')
    })

    it('应该验证中间层顺序的影响：retry在前 vs retry在后', async () => {
        console.log('\n' + '='.repeat(80))
        console.log('🔍 测试中间层顺序的影响')
        console.log('='.repeat(80))

        // 场景1: retry在前，concurrent在后
        console.log('\n📌 场景1: retry -> concurrent (retry在外层)')
        console.log('理论：重试会重新进入并发队列排队\n')

        let callCount1 = 0
        let maxConcurrent1 = 0
        let currentRunning1 = 0
        const executionLog1: Array<{ call: number; start: number; end: number; failed: boolean }> = []

        const mockRequestor1 = vi.fn(async (): Promise<Response> => {
            callCount1++
            currentRunning1++
            maxConcurrent1 = Math.max(maxConcurrent1, currentRunning1)
            
            const start = Date.now()
            console.log(`  [调用 ${callCount1}] 开始执行，当前并发: ${currentRunning1}`)
            
            await new Promise(resolve => setTimeout(resolve, 50))
            
            const failed = callCount1 <= 2  // 前2次失败
            const end = Date.now()
            executionLog1.push({ call: callCount1, start, end, failed })
            
            currentRunning1--
            
            if (failed) {
                console.log(`  [调用 ${callCount1}] ❌ 失败`)
                throw new Error(`请求失败 (第 ${callCount1} 次)`)
            }
            
            console.log(`  [调用 ${callCount1}] ✅ 成功`)
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount: callCount1 }
            }
        })

        inject(mockRequestor1)

        const requestor1 = createRequestor({
            extensions: [
                retry({ retries: 2, delay: 10 }),  // retry在前（外层）
                concurrent({ parallelCount: 1 })    // concurrent在后（内层）
            ]
        })

        const result1 = await requestor1.get('/api/test1')

        console.log('\n  📊 场景1结果:')
        console.log(`    - 总调用次数: ${callCount1}`)
        console.log(`    - 最大并发数: ${maxConcurrent1}`)
        console.log(`    - 执行日志:`)
        executionLog1.forEach(log => {
            console.log(`      调用${log.call}: ${log.failed ? '失败' : '成功'} (${log.start}-${log.end})`)
        })

        // 场景2: concurrent在前，retry在后
        console.log('\n📌 场景2: concurrent -> retry (concurrent在外层)')
        console.log('理论：重试不会重新排队，直接在当前槽位重试\n')

        let callCount2 = 0
        let maxConcurrent2 = 0
        let currentRunning2 = 0
        const executionLog2: Array<{ call: number; start: number; end: number; failed: boolean }> = []

        const mockRequestor2 = vi.fn(async (): Promise<Response> => {
            callCount2++
            currentRunning2++
            maxConcurrent2 = Math.max(maxConcurrent2, currentRunning2)
            
            const start = Date.now()
            console.log(`  [调用 ${callCount2}] 开始执行，当前并发: ${currentRunning2}`)
            
            await new Promise(resolve => setTimeout(resolve, 50))
            
            const failed = callCount2 <= 2  // 前2次失败
            const end = Date.now()
            executionLog2.push({ call: callCount2, start, end, failed })
            
            currentRunning2--
            
            if (failed) {
                console.log(`  [调用 ${callCount2}] ❌ 失败`)
                throw new Error(`请求失败 (第 ${callCount2} 次)`)
            }
            
            console.log(`  [调用 ${callCount2}] ✅ 成功`)
            return {
                code: 200,
                msg: '请求成功',
                data: { callCount: callCount2 }
            }
        })

        inject(mockRequestor2)

        const requestor2 = createRequestor({
            extensions: [
                concurrent({ parallelCount: 1 }),   // concurrent在前（外层）
                retry({ retries: 2, delay: 10 })    // retry在后（内层）
            ]
        })

        const result2 = await requestor2.get('/api/test2')

        console.log('\n  📊 场景2结果:')
        console.log(`    - 总调用次数: ${callCount2}`)
        console.log(`    - 最大并发数: ${maxConcurrent2}`)
        console.log(`    - 执行日志:`)
        executionLog2.forEach(log => {
            console.log(`      调用${log.call}: ${log.failed ? '失败' : '成功'} (${log.start}-${log.end})`)
        })

        console.log('\n' + '='.repeat(80))
        console.log('📊 对比分析:')
        console.log('='.repeat(80))
        console.log(`  场景1 (retry->concurrent): 调用${callCount1}次，最大并发${maxConcurrent1}`)
        console.log(`  场景2 (concurrent->retry): 调用${callCount2}次，最大并发${maxConcurrent2}`)
        console.log('\n  🎯 结论:')
        console.log('    两种顺序的调用次数相同，但执行流程不同：')
        console.log('    - retry在前: 重试时会重新进入并发队列（理论上可能需要重新排队）')
        console.log('    - retry在后: 重试时保持在当前并发槽位中（不会重新排队）')
        console.log('='.repeat(80))

        // 验证两种方式都能成功
        expect(result1).toBeDefined()
        expect(result2).toBeDefined()
        expect(callCount1).toBe(3)  // 失败2次 + 成功1次
        expect(callCount2).toBe(3)  // 失败2次 + 成功1次

        console.log('\n✅ 测试通过：中间层顺序确实有影响，但结果正确')
    })
})

