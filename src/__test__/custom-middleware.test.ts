import { describe, it, expect, beforeEach } from 'vitest'
import { inject, createRequestor } from '../index'
import { createMockRequestor, type Data } from './test-utils'
import type { Middleware } from '@/types'

describe('自定义中间件测试', () => {
    beforeEach(() => {
        // 每次测试前清理
        const mock = createMockRequestor()
        inject(mock.mockRequestor)
    })

    it('应该测试自定义中间件：基本功能正常执行', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        // 创建一个简单的自定义中间件
        const customMiddleware: Middleware = async ({ config, next }) => {
            // 在请求前添加自定义header
            config.headers = {
                ...config.headers,
                'X-Custom-Header': 'test-value'
            }
            
            // 执行请求
            const result = await next()
            
            // 在响应后可以做处理
            return result
        }

        const requestor = createRequestor({
            extensions: [customMiddleware]
        })

        const result = await requestor.get<Data>('/api/users')

        // 验证请求成功执行
        expect(result.code).toBe(200)
        expect(result.data.url).toBe('/api/users')
        expect(mock.callCount).toBe(1)
        
        // 验证自定义header被添加
        expect(mock.mockRequestor).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Custom-Header': 'test-value'
                })
            })
        )
    })

    it('应该测试全局 ctx：多个中间件之间共享上下文', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        // 第一个中间件：在 ctx 中设置数据
        const middleware1: Middleware = async ({ ctx, next }) => {
            ctx.timestamp = Date.now()
            ctx.user = { id: 1, name: 'Alice' }
            ctx.requestCount = (ctx.requestCount || 0) + 1
            
            const result = await next()
            return result
        }

        // 第二个中间件：读取并修改 ctx 中的数据
        const middleware2: Middleware = async ({ ctx, next }) => {
            // 验证可以读取第一个中间件设置的数据
            expect(ctx.timestamp).toBeDefined()
            expect(ctx.user).toEqual({ id: 1, name: 'Alice' })
            expect(ctx.requestCount).toBe(1)
            
            // 添加新的数据
            ctx.processed = true
            ctx.middlewareChain = ['middleware1', 'middleware2']
            
            const result = await next()
            return result
        }

        // 第三个中间件：验证前面中间件设置的所有数据
        const middleware3: Middleware = async ({ ctx, next }) => {
            // 验证所有前面中间件设置的数据都存在
            expect(ctx.timestamp).toBeDefined()
            expect(ctx.user).toEqual({ id: 1, name: 'Alice' })
            expect(ctx.requestCount).toBe(1)
            expect(ctx.processed).toBe(true)
            expect(ctx.middlewareChain).toEqual(['middleware1', 'middleware2'])
            
            // 执行请求
            const result = await next()
            
            // 在响应后也能访问 ctx
            expect(ctx.user.name).toBe('Alice')
            
            return result
        }

        const requestor = createRequestor({
            extensions: [middleware1, middleware2, middleware3]
        })

        const result = await requestor.get<Data>('/api/users')

        // 验证请求成功
        expect(result.code).toBe(200)
        expect(mock.callCount).toBe(1)
    })

    it('应该测试自定义中间件：可以修改请求配置', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        // 创建一个修改请求配置的中间件
        const urlPrefixMiddleware: Middleware = async ({ config, next }) => {
            // 为所有请求添加 API 前缀
            config.url = `/api/v1${config.url}`
            return next()
        }

        const requestor = createRequestor({
            extensions: [urlPrefixMiddleware]
        })

        await requestor.get<Data>('/users')

        // 验证 URL 被修改
        expect(mock.mockRequestor).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/api/v1/users'
            })
        )
    })

    it('应该测试自定义中间件：可以修改响应数据', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        // 创建一个修改响应的中间件
        const responseTransformMiddleware: Middleware = async ({ next }) => {
            const result = await next()
            
            // 修改响应数据，添加额外信息
            return {
                ...result,
                data: {
                    ...result.data,
                    transformed: true,
                    transformedAt: Date.now()
                }
            }
        }

        const requestor = createRequestor({
            extensions: [responseTransformMiddleware]
        })

        const result = await requestor.get<Data>('/api/users')

        // 验证响应被修改
        expect(result.data.transformed).toBe(true)
        expect(result.data.transformedAt).toBeDefined()
        expect(result.data.url).toBe('/api/users') // 原始数据仍存在
    })

    it('应该测试自定义中间件：可以实现日志记录功能', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const logs: Array<{ type: string; message: string; timestamp: number }> = []

        // 创建一个日志中间件
        const loggingMiddleware: Middleware = async ({ config, ctx, next }) => {
            const startTime = Date.now()
            
            // 记录请求开始
            logs.push({
                type: 'request',
                message: `发起请求: ${config.method} ${config.url}`,
                timestamp: startTime
            })
            
            // 在 ctx 中保存开始时间
            ctx.startTime = startTime
            
            try {
                const result = await next()
                
                // 记录请求成功
                const duration = Date.now() - startTime
                logs.push({
                    type: 'success',
                    message: `请求成功: ${config.url} (耗时: ${duration}ms)`,
                    timestamp: Date.now()
                })
                
                return result
            } catch (error) {
                // 记录请求失败
                logs.push({
                    type: 'error',
                    message: `请求失败: ${config.url}`,
                    timestamp: Date.now()
                })
                throw error
            }
        }

        const requestor = createRequestor({
            extensions: [loggingMiddleware]
        })

        await requestor.get<Data>('/api/users')

        // 验证日志记录
        expect(logs.length).toBe(2)
        expect(logs[0].type).toBe('request')
        expect(logs[0].message).toContain('发起请求')
        expect(logs[1].type).toBe('success')
        expect(logs[1].message).toContain('请求成功')
    })

    it('应该测试自定义中间件：多个中间件的执行顺序（洋葱模型）', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const executionOrder: string[] = []

        const middleware1: Middleware = async ({ ctx, next }) => {
            executionOrder.push('middleware1-before')
            ctx.order = ['m1']
            
            const result = await next()
            
            executionOrder.push('middleware1-after')
            ctx.order.push('m1-after')

            // 验证 ctx 中记录的顺序
            expect(ctx.order).toEqual(['m1', 'm2', 'm3', 'm3-after', 'm2-after', 'm1-after'])
            return result
        }

        const middleware2: Middleware = async ({ ctx, next }) => {
            executionOrder.push('middleware2-before')
            ctx.order.push('m2')
            
            const result = await next()
            
            executionOrder.push('middleware2-after')
            ctx.order.push('m2-after')
            return result
        }

        const middleware3: Middleware = async ({ ctx, next }) => {
            executionOrder.push('middleware3-before')
            ctx.order.push('m3')
            
            const result = await next()
            
            executionOrder.push('middleware3-after')
            ctx.order.push('m3-after')
            
            return result
        }

        const requestor = createRequestor({
            extensions: [middleware1, middleware2, middleware3]
        })

        await requestor.get<Data>('/api/users')

        // 验证洋葱模型的执行顺序
        expect(executionOrder).toEqual([
            'middleware1-before',
            'middleware2-before',
            'middleware3-before',
            'middleware3-after',
            'middleware2-after',
            'middleware1-after'
        ])
    })

    it('应该测试自定义中间件：可以在 ctx 中传递复杂对象', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        const middleware1: Middleware = async ({ ctx, next }) => {
            // 在 ctx 中设置复杂对象
            ctx.metadata = {
                user: { id: 1, name: 'Alice', roles: ['admin', 'user'] },
                permissions: new Set(['read', 'write', 'delete']),
                cache: new Map([['key1', 'value1'], ['key2', 'value2']]),
                config: {
                    timeout: 3000,
                    retry: true,
                    headers: { 'X-Custom': 'value' }
                }
            }
            
            return next()
        }

        const middleware2: Middleware = async ({ ctx, next }) => {
            // 验证可以正确读取复杂对象
            expect(ctx.metadata.user.name).toBe('Alice')
            expect(ctx.metadata.user.roles).toContain('admin')
            expect(ctx.metadata.permissions.has('write')).toBe(true)
            expect(ctx.metadata.cache.get('key1')).toBe('value1')
            expect(ctx.metadata.config.timeout).toBe(3000)
            
            // 修改复杂对象
            ctx.metadata.user.roles.push('superuser')
            ctx.metadata.permissions.add('execute')
            ctx.metadata.cache.set('key3', 'value3')
            
            return next()
        }

        const middleware3: Middleware = async ({ ctx, next }) => {
            // 验证修改后的复杂对象
            expect(ctx.metadata.user.roles).toContain('superuser')
            expect(ctx.metadata.permissions.has('execute')).toBe(true)
            expect(ctx.metadata.cache.get('key3')).toBe('value3')
            
            return next()
        }

        const requestor = createRequestor({
            extensions: [middleware1, middleware2, middleware3]
        })

        const result = await requestor.get<Data>('/api/users')
        expect(result.code).toBe(200)
    })

    it('应该测试自定义中间件：不调用 next() 可以中断请求', async () => {
        const mock = createMockRequestor()
        inject(mock.mockRequestor)

        // 创建一个权限检查中间件，不满足条件时不调用 next()
        const authMiddleware: Middleware = async ({ ctx }) => {
            ctx.authChecked = true
            
            // 模拟权限检查失败，直接返回错误，不调用 next()
            return {
                code: 403,
                msg: '权限不足',
                data: null
            }
        }

        const requestor = createRequestor({
            extensions: [authMiddleware]
        })

        const result = await requestor.get('/api/users')

        // 验证请求被中断，没有真正执行
        expect(result.code).toBe(403)
        expect(result.msg).toBe('权限不足')
        expect(mock.callCount).toBe(0) // 实际请求没有被调用
    })
})

