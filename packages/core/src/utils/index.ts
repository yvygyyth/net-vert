export const DEFAULT_KEY = 'default'

export const randomId = () => {
    return `${Date.now()}_${Math.random().toString().slice(2, 8)}`
}