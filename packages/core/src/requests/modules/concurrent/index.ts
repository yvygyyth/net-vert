import type { TypedMiddleware, Middleware } from '@/types'
import { MIDDLEWARE_TYPE } from '@/constants'
import type { ConcurrentOptions } from './type'
import { ConcurrentPool } from './concurrentPool'

let id = 0

const defaultConfig: ConcurrentOptions = {
    parallelCount: 4,
    createId: () => id++
}

export const concurrent = <D = any, R = any>(options?: Partial<ConcurrentOptions<D>>): TypedMiddleware<typeof MIDDLEWARE_TYPE.CONCURRENT, false, D, R> => {
    const { parallelCount, createId } = { ...defaultConfig, ...options }
    const pool = new ConcurrentPool(parallelCount)
    
    const middleware:Middleware<false, D, R> = ({ config, next }) => {
        const id = createId({ config })
        return pool.add(id, () => next())
    }
    
    // 添加中间件类型标记
    return Object.assign(middleware, { __middlewareType: MIDDLEWARE_TYPE.CONCURRENT })
}