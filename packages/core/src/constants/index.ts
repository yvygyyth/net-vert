export const REQUEST_METHOD = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
} as const;

export type RequestMethod = typeof REQUEST_METHOD[keyof typeof REQUEST_METHOD];

export const DEFAULT_KEY = 'default'