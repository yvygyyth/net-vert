export enum REQUEST_METHOD {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
}

export type RequestMethod = REQUEST_METHOD;

export enum MIDDLEWARE_TYPE {
    CACHE = 'cache',
    RETRY = 'retry',
    IDEMPOTENT = 'idempotent',
    CONCURRENT = 'concurrent',
    SYNC = 'sync',
}

export type MiddlewareType = MIDDLEWARE_TYPE;

export const DEFAULT_KEY = 'default'