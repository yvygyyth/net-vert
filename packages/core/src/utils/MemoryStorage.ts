type AnyRecord = Record<string, any>

type MemoryMap<Schema extends AnyRecord = AnyRecord> = Map<keyof Schema, Schema[keyof Schema]>

export class MemoryStorage<Schema extends AnyRecord = AnyRecord>{
    private store: MemoryMap<Schema> = new Map()
    getItem<K extends keyof Schema>(key: K): Schema[K] | undefined {
        return this.store.get(key) as Schema[K] | undefined
    }

    setItem<K extends keyof Schema>(key: K, value: Schema[K]): Schema[K] {
        this.store.set(key, value)
        return value
    }

    removeItem<K extends keyof Schema>(key: K): void {
        this.store.delete(key)
    }

    clear(): void {
        this.store.clear()
    }

    length(): number {
        return this.store.size
    }

    keys(): (keyof Schema)[] {
        return Array.from(this.store.keys())
    }

    iterate(iteratee: <K extends keyof Schema>(value: Schema[K], key: K, iterationNumber: number) => void): void {
        let index = 0
        for (const [key, value] of this.store.entries()) {
            iteratee(value, key, index)
            index++
        }
    }
}
