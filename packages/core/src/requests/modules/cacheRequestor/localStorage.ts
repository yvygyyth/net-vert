import localforage from 'localforage';

interface CacheStore {
    has(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<T>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

export default class LocalForageStore implements CacheStore {
    constructor(options?: LocalForageOptions) {
        if (options) localforage.config(options);
    }

    async has(key: string): Promise<boolean> {
        return (await localforage.getItem(key)) !== null;
    }

    async get<T>(key: string): Promise<T | undefined> {
        try {
            const value = await localforage.getItem<T>(key);
            return value ?? undefined;
        } catch (e) {
            console.error('Error getting data', e);
            return undefined;
        }
    }

    async set<T>(key: string, value: T): Promise<T> {
        await localforage.setItem(key, value);
        return value;
    }

    async delete(key: string): Promise<void> {
        await localforage.removeItem(key);
    }

    async clear(): Promise<void> {
        await localforage.clear();
    }
}