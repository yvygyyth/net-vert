import type { Key } from './index'

/**
 * 辅助类型：将联合类型转换为交叉类型
 * @internal
 * @example
 * ```ts
 * type Union = { a: string } | { b: number }
 * type Result = UnionToIntersection<Union>
 * // Result = { a: string } & { b: number }
 * ```
 */
type UnionToIntersection<U> = 
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

/**
 * 扁平化多个对象类型
 * @template Types - 需要扁平化的对象类型元组
 * @example
 * ```ts
 * type Result = Flatten<[{ a: string }, { b: number }, { c: boolean }]>
 * // Result = { a: string } & { b: number } & { c: boolean }
 * ```
 */
export type Flatten<Types extends readonly any[]> = UnionToIntersection<Types[number]>

/**
 * 给类型添加可选的 instanceKey 字段
 * @template T - 源对象类型
 * @example
 * ```ts
 * type Config = { timeout: number }
 * type Result = WithInstanceKey<Config>
 * // Result = { timeout: number; instanceKey?: Key }
 * ```
 */
export type WithInstanceKey<T> = T & {
    /** 请求器实例 key（可选） */
    instanceKey?: Key
}

/**
 * 组合工具：扁平化多个对象类型并添加 instanceKey
 * @template Types - 需要扁平化的对象类型元组
 * @example
 * ```ts
 * type Result = FlattenWithInstanceKey<[TypeA, TypeB, TypeC]>
 * // Result = TypeA & TypeB & TypeC & { instanceKey?: Key }
 * ```
 */
export type FlattenWithInstanceKey<Types extends readonly any[]> = 
    WithInstanceKey<Flatten<Types>>

