class persistenceStore{
    has(key: string): boolean {
        return this.get(key) ? true : false
    }
    // 获取缓存
    get<T>(key: string): T | undefined {
        const value = localStorage.getItem(key)
        if (value) {
            try {
                return JSON.parse(value)
            } catch (e) {
                console.error('Error parsing cached data', e)
                return undefined
            }
        }
        return undefined
    }

    // 设置缓存
    set<T>(key: string, value: T): T {
        try {
            const serializedValue = JSON.stringify(value)
            localStorage.setItem(key, serializedValue)
        } catch (e) {
            console.error('Error saving data to localStorage', e)
        }
        return value
    }

    // 删除缓存
    remove(key: string): void {
        localStorage.removeItem(key)
    }

    // 清空所有缓存
    clear(): void {
        localStorage.clear()
    }
}

export default new persistenceStore
