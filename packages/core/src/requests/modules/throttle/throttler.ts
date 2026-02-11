import { ThrottleTimeoutError, type QueueItem, type ThrottlerStatus } from './type'

/**
 * 节流器接口
 */
export interface Throttler {
    /** 添加任务到队列 */
    add: <T>(task: () => Promise<T>) => Promise<T>
    /** 获取节流器状态 */
    getStatus: () => ThrottlerStatus
    /** 清空队列（慎用） */
    clear: () => void
}

/**
 * 创建节流器
 * 管理请求队列，确保每两次请求之间至少间隔指定时间
 */
export function createThrottler(interval: number, timeout?: number): Throttler {
    const queue: QueueItem<any>[] = []
    let lastExecutionTime = 0
    let isProcessing = false

    /**
     * 辅助函数：休眠
     */
    const sleep = (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    /**
     * 检查并拒绝队列头部的超时请求
     * @returns 如果移除了超时项返回 true
     */
    const checkHeadTimeout = (): boolean => {
        if (timeout === void 0 || queue.length === 0) {
            return false
        }

        const now = Date.now()
        const item = queue[0]
        const queueTime = now - item.timestamp

        // 只检查队列头部，如果头部未超时则后面的都不会超时（FIFO）
        if (queueTime >= timeout) {
            queue.shift()
            item.reject(new ThrottleTimeoutError(timeout, queueTime))
            return true
        }

        return false
    }

    /**
     * 处理队列
     */
    const processQueue = async (): Promise<void> => {
        // 如果正在处理或队列为空，直接返回
        if (isProcessing || queue.length === 0) {
            return
        }

        isProcessing = true

        while (queue.length > 0) {
            // 检查队列头部是否超时
            if (timeout !== void 0 && checkHeadTimeout()) {
                continue // 超时项已被移除，继续处理下一个
            }

            // 队列可能在超时检查后变空
            if (queue.length === 0) {
                break
            }

            const now = Date.now()
            const elapsed = now - lastExecutionTime

            // 如果距离上次执行时间不够，等待
            if (lastExecutionTime > 0 && elapsed < interval) {
                const waitTime = interval - elapsed
                await sleep(waitTime)
            }

            // 取出队列第一个任务并执行
            const item = queue.shift()
            if (item) {
                lastExecutionTime = Date.now()
                // 执行任务并处理结果
                item.task().then(item.resolve).catch(item.reject)
            }
        }

        isProcessing = false
    }

    /**
     * 添加任务到队列
     */
    const add = <T>(task: () => Promise<T>): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            // 加入队列
            queue.push({
                task,
                resolve,
                reject,
                timestamp: Date.now()
            })

            // 启动队列处理
            processQueue()
        })
    }

    /**
     * 获取节流器状态
     */
    const getStatus = (): ThrottlerStatus => {
        const nextExecutionTime = queue.length > 0 ? lastExecutionTime + interval : null

        return {
            queueLength: queue.length,
            lastExecutionTime,
            isProcessing,
            nextExecutionTime
        }
    }

    /**
     * 清空队列
     */
    const clear = (): void => {
        queue.length = 0
    }

    return {
        add,
        getStatus,
        clear
    }
}
