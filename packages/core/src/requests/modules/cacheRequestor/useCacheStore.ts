import LocalForageStore from './localStorage'

const localStore = new LocalForageStore()

const session = new Map()
export const useCacheStore = (persist: boolean) => {
    if (persist) {
        return localStore
    } else {
        return session
    }
}
