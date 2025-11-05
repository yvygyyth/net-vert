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
        shouldFail
    } = options

    let callCount = 0

    const mockRequestor = vi.fn(async (config): Promise<Response> => {
        callCount++

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, delay))

        // 检查是否应该失败
        if (shouldFail && shouldFail(callCount, config)) {
            throw new Error(`请求失败 (第 ${callCount} 次)`)
        }

        // 生成响应数据
        const data = {
            url: config.url,
            method: config.method,
            data: config.data,
            callCount,
            timestamp: Date.now()
        }

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
 * 等待指定时间
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建一个失败 N 次后成功的 mock 请求器
 * @param failCount 每个请求失败的次数
 * @param options mock 选项
 */
export function createFailNTimesMockRequestor(
    failCount: number, 
    options: MockRequestorOptions = {}
) {
    return createMockRequestor({
        ...options,
        shouldFail: (callCount) => callCount <= failCount
    })
}
