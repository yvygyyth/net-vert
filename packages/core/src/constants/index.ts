export const REQUEST_METHOD = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
} as const;

export type RequestMethod = typeof REQUEST_METHOD[keyof typeof REQUEST_METHOD];

export const MIDDLEWARE_TYPE = {
    CACHE: 'cache',
    RETRY: 'retry',
    IDEMPOTENT: 'idempotent',
    CONCURRENT: 'concurrent',
    SYNC: 'sync',
} as const;

export type MiddlewareType = typeof MIDDLEWARE_TYPE[keyof typeof MIDDLEWARE_TYPE];

export const DEFAULT_KEY = 'default'