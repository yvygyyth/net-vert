import type { Middleware } from '@/types'
import type { ConcurrentOptions } from './type'
import { ConcurrentPool } from './concurrentPool'

let id = 0

const defaultConfig: ConcurrentOptions = {
    parallelCount: 4,
    createId: () => id++
}

export const concurrent = (options?: Partial<ConcurrentOptions>): Middleware => {
    const { parallelCount, createId } = { ...defaultConfig, ...options }
    const pool = new ConcurrentPool(parallelCount)
    
    return ({ config, next }) => {
        const id = createId({ config })
        return pool.add(id, () => next())
    }
}