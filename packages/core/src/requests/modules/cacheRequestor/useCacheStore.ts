
import localforage from 'localforage';
import persistenceStore from './localStorage'

export const useCacheStore = <P extends boolean>(
    { persist, name, sync }: {
        persist: P;
        name: P extends true ? string : undefined;
        sync: boolean;
    }
) => {
    if (persist && sync) {
        return persistenceStore;
    }else if (persist) {
        const store = localforage.createInstance({
            name,
            // driver: sync
            // ?undefined
            // :localforage.LOCALSTORAGE,
        });
        return {
            get: <T>(key: string) => store.getItem<T>(key),
            set: <T>(key: string, value: T) => store.setItem(key, value),
            remove: (key: string) => store.removeItem(key),
            clear: () => store.clear(),
        };
    }else {
        const map = new Map<string, any>();
        return {
            get: (key: string) => map.get(key),
            set: <T>(key: string, value: T) => map.set(key, value),
            remove: (key: string) => map.delete(key),
            clear: () => map.clear(),
        };
    }
};
