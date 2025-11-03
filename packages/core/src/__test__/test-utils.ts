import { vi } from 'vitest'

/**
 * 标准响应接口
 */
export interface Response<T = any> {
    code: number
    msg: string
    data: T
}

/**
 * 标准数据接口
 */
export interface Data {
    url: string
    method: string
    data?: any
    callCount?: number
    timestamp?: number
    [key: string]: any
}

/**
 * Mock 请求器选项
 */
export interface MockRequestorOptions {
    /** 延迟时间（毫秒），默认 50ms */
    delay?: number
    /** 是否在特定条件下失败 */
    shouldFail?: (callCount: number, config: any) => boolean
    /** 自定义响应数据生成器 */
    customData?: (callCount: number, config: any) => any
    /** 是否打印日志，默认 true */
    log?: boolean
}

/**
 * 创建一个 mock 请求器
 * 
 * @example
 * ```ts
 * const { mockRequestor, callCount } = createMockRequestor()
 * inject(mockRequestor)
 * ```
 */
export function createMockRequestor(options: MockRequestorOptions = {}) {
    const {
        delay = 50,
        shouldFail,
        customData,
        log = false
    } = options

    let callCount = 0

    const mockRequestor = vi.fn(async (config): Promise<Response> => {
        callCount++
        console.log('  - callCount:', callCount)
        if (log) {
            console.log(`第 ${callCount} 次调用请求器: ${config.method?.toUpperCase() || 'GET'} ${config.url || ''}`)
        }

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, delay))

        // 检查是否应该失败
        if (shouldFail && shouldFail(callCount, config)) {
            throw new Error(`请求失败 (第 ${callCount} 次)`)
        }

        // 生成响应数据
        const defaultData = {
            url: config.url,
            method: config.method,
            data: config.data,
            callCount,
            timestamp: Date.now()
        }

        const data = customData 
            ? { ...defaultData, ...customData(callCount, config) }
            : defaultData

        return {
            code: 200,
            msg: '请求成功',
            data
        }
    })

    return {
        mockRequestor,
        get callCount() {
            return callCount
        },
        reset() {
            callCount = 0
            mockRequestor.mockClear()
        }
    }
}

/**
 * 创建并发监控器
 * 用于跟踪最大并发数
 */
export function createConcurrencyMonitor() {
    let currentRunning = 0
    let maxConcurrent = 0

    return {
        get current() {
            return currentRunning
        },
        get max() {
            return maxConcurrent
        },
        enter() {
            currentRunning++
            maxConcurrent = Math.max(maxConcurrent, currentRunning)
        },
        exit() {
            currentRunning--
        },
        reset() {
            currentRunning = 0
            maxConcurrent = 0
        }
    }
}

/**
 * 创建执行日志记录器
 */
export interface ExecutionLog {
    id: number
    start: number
    end: number
    success: boolean
    [key: string]: any
}

export function createExecutionLogger() {
    const logs: ExecutionLog[] = []

    return {
        get logs() {
            return logs
        },
        log(entry: ExecutionLog) {
            logs.push(entry)
        },
        clear() {
            logs.length = 0
        },
        print() {
            console.log('\n📊 执行日志:')
            logs.forEach(log => {
                const duration = log.end - log.start
                const status = log.success ? '✅' : '❌'
                console.log(`  ${status} [${log.id}] ${log.start} -> ${log.end} (耗时 ${duration}ms)`)
            })
        }
    }
}

/**
 * 创建一个带完整监控的 mock 请求器
 * 包含并发监控、执行日志等功能
 */
export function createMonitoredMockRequestor(options: MockRequestorOptions = {}) {
    const {
        delay = 50,
        shouldFail,
        customData,
        log = true
    } = options

    let callCount = 0
    const concurrencyMonitor = createConcurrencyMonitor()
    const executionLogger = createExecutionLogger()

    const mockRequestor = vi.fn(async (config): Promise<Response> => {
        const id = ++callCount
        concurrencyMonitor.enter()

        const start = Date.now()
        
        if (log) {
            console.log(`[请求 ${id}] 开始执行，当前并发数: ${concurrencyMonitor.current}`)
        }

        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, delay))

            // 检查是否应该失败
            if (shouldFail && shouldFail(callCount, config)) {
                throw new Error(`请求失败 (第 ${callCount} 次)`)
            }

            // 生成响应数据
            const defaultData = {
                url: config.url,
                method: config.method,
                data: config.data,
                callCount,
                timestamp: Date.now()
            }

            const data = customData 
                ? { ...defaultData, ...customData(callCount, config) }
                : defaultData

            const end = Date.now()
            executionLogger.log({ id, start, end, success: true })

            if (log) {
                console.log(`[请求 ${id}] 执行完成`)
            }

            return {
                code: 200,
                msg: '请求成功',
                data
            }
        } catch (error) {
            const end = Date.now()
            executionLogger.log({ id, start, end, success: false })
            
            if (log) {
                console.log(`[请求 ${id}] 执行失败`)
            }
            
            throw error
        } finally {
            concurrencyMonitor.exit()
        }
    })

    return {
        mockRequestor,
        get callCount() {
            return callCount
        },
        concurrencyMonitor,
        executionLogger,
        reset() {
            callCount = 0
            mockRequestor.mockClear()
            concurrencyMonitor.reset()
            executionLogger.clear()
        }
    }
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建一个失败 N 次后成功的 mock 请求器
 */
export function createFailNTimesMockRequestor(failCount: number, options: MockRequestorOptions = {}) {
    return createMockRequestor({
        ...options,
        shouldFail: (callCount) => callCount <= failCount
    })
}

