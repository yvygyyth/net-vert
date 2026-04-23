import type { RequestConfig } from './base';
import { type MiddlewareType } from '@/constants';
// 中间件上下文（共享的 this）
export interface MiddlewareContext extends Record<string, any> {}

// Middleware 类型：中间件都是异步的，返回 Promise
export type Middleware<D = any, R = any> = (context: {
    config: RequestConfig<D>;
    next: () => Promise<R>;
    ctx: MiddlewareContext;
}) => Promise<R>;

// 带类型标记的中间件
export type TypedMiddleware<Type extends MiddlewareType, D = any, R = any> = Middleware<D, R> & {
    __middlewareType: Type;
};
