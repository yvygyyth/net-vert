import type { UnifiedConfig } from '@/types'

type Duration =
    | number
    | (({ key, config, response }: { key: string, config: UnifiedConfig; response: any }) => number)

export type CachedData = {
    value: any
    expiresAt: number
}

type IsValidParams = {
    key: string
    config: UnifiedConfig
    cachedData: CachedData
}

export type CacheRequestor<
    P extends boolean,
    S extends boolean
> = {
    key?: (config: UnifiedConfig) => string;
    duration?: Duration;
    sync?: S;
    persist?: P;
    name?: [P, S] extends [true, false] 
    ? string
    : undefined;
    isValid?: S extends true
    ? (params: IsValidParams) => boolean
    : (params: IsValidParams) => boolean | Promise<boolean>
}