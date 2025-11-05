/**
 * Storage 接口
 * 定义存储器的基本操作
 */
export interface IStorage<Schema extends Record<string, any> = Record<string, any>> {
    /**
     * 获取存储项
     */
    getItem<K extends keyof Schema>(key: K): Schema[K] | undefined
    
    /**
     * 设置存储项
     */
    setItem<K extends keyof Schema>(key: K, value: Schema[K]): Schema[K]
    
    /**
     * 删除存储项
     */
    removeItem<K extends keyof Schema>(key: K): void
    
    /**
     * 清空所有存储项
     */
    clear(): void
    
    /**
     * 获取存储项数量
     */
    length(): number
    
    /**
     * 获取所有 key
     */
    keys(): (keyof Schema)[]
    
    /**
     * 遍历所有存储项
     */
    iterate(iteratee: <K extends keyof Schema>(value: Schema[K], key: K, iterationNumber: number) => void): void
}

