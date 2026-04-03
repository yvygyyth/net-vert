# Throttle 中间件

## 简介

`throttle` 中间件用于控制请求速率，确保所有请求按照最小间隔时间排队执行。默认情况下不会丢弃任何请求，所有请求都会被执行，只是按照配置的间隔时间排队处理。

可以通过配置 `timeout` 参数来限制请求在队列中的最长等待时间，超时的请求会被拒绝并抛出 `ThrottleTimeoutError`。

## 核心特性

- ✅ **最小间隔**: 确保每两次请求之间至少间隔指定时间
- ✅ **全局共享**: 同一个中间件实例的所有请求共享队列
- ✅ **自动排队**: 请求过快时自动排队等待
- ✅ **超时控制**: 支持配置队列超时时间，防止请求无限等待
- ✅ **实时监控**: 提供队列状态查询接口
- ✅ **易于组合**: 可与其他中间件（cache、retry、idempotent 等）配合使用

## 基本使用

```typescript
import { createRequestor } from 'net-vert'
import { throttle } from 'net-vert/requests'

// 创建节流中间件，每次请求最少间隔 1 秒
const throttleMiddleware = throttle({
    interval: 1000
})

const requestor = createRequestor({
    extensions: [throttleMiddleware]
})

// 快速发起 3 个请求
await Promise.all([
    requestor.get('/api/users'), // 立即执行
    requestor.get('/api/posts'), // 等待 1 秒后执行
    requestor.get('/api/comments') // 等待 2 秒后执行
])
```

## 配置选项

```typescript
interface ThrottleOptions {
    /** 最小请求间隔（毫秒），默认 1000 */
    interval: number

    /**
     * 队列超时时间（毫秒）
     * 如果请求在队列中等待超过此时间，将被拒绝并抛出 ThrottleTimeoutError
     * - 不设置（undefined）：永不超时，所有请求都会执行（默认）
     * - 设为 0：立即超时，排队的请求直接被拒绝
     * - 设为正数：等待指定时间后超时
     */
    timeout?: number
}
```

## 超时控制

当队列中的请求等待时间过长时，可以配置 `timeout` 来自动拒绝超时请求：

```typescript
const throttleMiddleware = throttle({
    interval: 1000, // 每秒最多 1 个请求
    timeout: 5000 // 超过 5 秒未执行则丢弃
})

// 快速发起 10 个请求
const promises = Array.from({ length: 10 }, (_, i) => requestor.get(`/api/data/${i}`))

try {
    await Promise.allSettled(promises)
} catch (error) {
    if (error instanceof ThrottleTimeoutError) {
        console.log('请求在队列中等待超时')
    }
}
// 前 5-6 个会成功执行，后面的会因超时被拒绝
```

### 不同的超时策略

```typescript
// 1. 永不超时（默认）- 所有请求都会执行
const noTimeout = throttle({
    interval: 1000
})

// 2. 立即超时 - 只执行第一个，其余全部拒绝
const immediateTimeout = throttle({
    interval: 1000,
    timeout: 0
})

// 3. 等待 5 秒后超时
const delayedTimeout = throttle({
    interval: 1000,
    timeout: 5000
})
```

### 超时与重试组合

超时的请求会抛出 `ThrottleTimeoutError`，可以被外层的 `retry` 中间件捕获：

```typescript
const requestor = createRequestor({
    extensions: [
        retry({ retries: 2 }), // 失败重试 2 次
        throttle({
            interval: 1000,
            timeout: 3000 // 超时 3 秒
        })
    ]
})

// 如果请求在队列中超时，retry 中间件会重新尝试
```

⚠️ **注意中间件顺序**：

- `retry -> throttle`: 超时后会重试，重新加入队列
- `throttle -> retry`: 超时错误直接抛出，不会重试

## 实时监控

```typescript
const throttleMiddleware = throttle({ interval: 1000 })

// 查看队列状态
const status = throttleMiddleware.throttler.getStatus()
console.log(status)
// => {
//   queueLength: 5,              // 当前排队数量
//   lastExecutionTime: 1234567,  // 上次执行时间戳
//   isProcessing: true,          // 是否正在处理
//   nextExecutionTime: 2234567   // 预计下次执行时间
// }

// 清空队列（慎用）
throttleMiddleware.throttler.clear()
```

## 与其他中间件组合

### 1. 节流 + 缓存

优先走缓存，缓存未命中时限制请求速率：

```typescript
const requestor = createRequestor({
    extensions: [
        cache({ duration: 5000 }), // 5 秒缓存
        throttle({ interval: 1000 }) // 1 秒间隔
    ]
})
```

### 2. 节流 + 幂等

合并相同请求并限制速率：

```typescript
const requestor = createRequestor({
    extensions: [
        idempotent(), // 去重相同请求
        throttle({ interval: 1000 }) // 限制速率
    ]
})

// 快速发起 3 个相同请求
await Promise.all([
    requestor.post('/api/submit', { data: 'same' }),
    requestor.post('/api/submit', { data: 'same' }),
    requestor.post('/api/submit', { data: 'same' })
])
// 幂等中间件会合并为 1 个请求，然后通过节流器执行
```

### 3. 节流 + 重试

限制速率 + 失败重试：

```typescript
const requestor = createRequestor({
    extensions: [
        throttle({ interval: 1000 }), // 限制速率
        retry({ retries: 3 }) // 失败重试
    ]
})
```

### 4. 完整组合

```typescript
const requestor = createRequestor({
    extensions: [
        cache({ duration: 5000 }), // 优先走缓存
        idempotent(), // 去重相同请求
        throttle({ interval: 1000 }), // 限制请求速率
        retry({ retries: 3 }) // 失败重试
    ]
})
```

## 使用场景

### 1. API 速率限制

防止触发服务端的限流机制：

```typescript
// 某些 API 限制每秒最多 10 次请求
const apiThrottle = throttle({ interval: 100 }) // 每 100ms 一次请求

const api = createRequestor({
    extensions: [apiThrottle]
})

// 即使快速发起 100 个请求，也会按照 100ms 间隔执行
const promises = Array.from({ length: 100 }, (_, i) => api.get(`/api/data/${i}`))
await Promise.all(promises)
```

### 2. 批量操作

```typescript
const batchThrottle = throttle({ interval: 500 })

const batchApi = createRequestor({
    extensions: [batchThrottle]
})

// 批量上传文件，控制速率避免网络拥堵
const files = [
    /* ... */
]
await Promise.all(files.map((file) => batchApi.post('/upload', file)))
```

### 3. 爬虫限速

```typescript
const crawlerThrottle = throttle({ interval: 2000 }) // 每 2 秒一次请求

const crawler = createRequestor({
    extensions: [crawlerThrottle]
})

// 礼貌地爬取数据，避免对目标服务器造成压力
const urls = [
    /* ... */
]
for (const url of urls) {
    await crawler.get(url)
}
```

## 独立节流器

不同的中间件实例拥有独立的节流器：

```typescript
const slowThrottle = throttle({ interval: 2000 })
const fastThrottle = throttle({ interval: 500 })

const slowApi = createRequestor({
    extensions: [slowThrottle]
})

const fastApi = createRequestor({
    extensions: [fastThrottle]
})

// 两个 API 实例使用不同的节流器，互不影响
await Promise.all([
    slowApi.get('/slow/endpoint'), // 2 秒间隔
    fastApi.get('/fast/endpoint') // 500ms 间隔
])
```

## 注意事项

1. **配置超时**: 如果请求发起速度持续快于执行速度，队列会一直增长。建议配置 `timeout` 参数自动丢弃等待过久的请求
2. **内存占用**: 大量排队的请求会占用内存，需要注意控制并发量或设置超时
3. **清空队列**: `throttler.clear()` 会清空队列，但已经在等待的 Promise 不会被 reject，可能导致内存泄漏
4. **错误处理**: 即使请求失败，节流器也会继续工作，不会影响后续请求
5. **性能优化**: 超时检查采用 O(1) 算法，只检查队列头部（FIFO 特性），不会遍历整个队列

## 与 concurrent 中间件的区别

| 特性     | throttle                    | concurrent                         |
| -------- | --------------------------- | ---------------------------------- |
| 控制目标 | 请求速率（时间间隔）        | 并发数量                           |
| 队列方式 | 串行排队                    | 控制并发数                         |
| 适用场景 | API 限流、礼貌爬虫          | 控制并发量、资源限制               |
| 典型配置 | `interval: 1000` (每秒一次) | `parallelCount: 5` (最多 5 个并发) |

可以组合使用：

```typescript
const requestor = createRequestor({
    extensions: [
        concurrent({ parallelCount: 3 }), // 最多 3 个并发
        throttle({ interval: 500 }) // 每次请求间隔 500ms
    ]
})
```

## 类型定义

```typescript
export interface ThrottleOptions {
    interval: number
}

export type ThrottleMiddleware<D = any, R = any> = Middleware<D, R> & {
    __middlewareType: MIDDLEWARE_TYPE.THROTTLE
    throttler: Throttler
}

export interface ThrottlerStatus {
    queueLength: number
    lastExecutionTime: number
    isProcessing: boolean
    nextExecutionTime: number | null
}
```
