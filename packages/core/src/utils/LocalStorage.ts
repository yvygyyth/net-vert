import type { IStorage } from '@/types/storage'

type AnyRecord = Record<string, any>

const storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage)

/**
 * LocalStorage 存储类
 * 基于浏览器的 localStorage 实现
 */
export class LocalStorage<Schema extends AnyRecord = AnyRecord> implements IStorage<Schema> {
    constructor() {}

    getItem<K extends keyof Schema>(key: K): Schema[K] | undefined {
        const fullKey = String(key)
        const value = storage.getItem(fullKey)
        if (value === null) return undefined
        try {
            return JSON.parse(value) as Schema[K]
        } catch (error) {
            console.error(`Failed to parse value for key: ${fullKey}`, error)
            return undefined
        }
    }

    setItem<K extends keyof Schema>(key: K, value: Schema[K]): Schema[K] {
        const fullKey = String(key)
        try {
            storage.setItem(fullKey, JSON.stringify(value))
        } catch (error) {
            console.error(`Failed to set value for key: ${fullKey}`, error)
            throw error
        }
        return value
    }

    removeItem<K extends keyof Schema>(key: K): void {
        const fullKey = String(key)
        storage.removeItem(fullKey)
    }

    clear(): void {
        storage.clear()
    }

    length(): number {
        return storage.length
    }

    keys(): (keyof Schema)[] {
        const keys: string[] = []
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (key) {
                keys.push(key)
            }
        }
        return keys as (keyof Schema)[]
    }

    iterate(iteratee: <K extends keyof Schema>(value: Schema[K], key: K, iterationNumber: number) => void): void {
        const keys = this.keys()
        keys.forEach((key, index) => {
            const value = this.getItem(key)
            if (value !== undefined) {
                iteratee(value, key, index)
            }
        })
    }
}
