# @net-vert/core

**轻量级依赖倒置网络请求库，专为扩展和易用而设计。**

[![npm version](https://img.shields.io/npm/v/@net-vert/core.svg)](https://www.npmjs.com/package/@net-vert/core)
[![license](https://img.shields.io/npm/l/@net-vert/core.svg)](https://github.com/yvygyyth/net-vert/blob/main/LICENSE)

GitHub 开源仓库 👉 [https://github.com/yvygyyth/net-vert](https://github.com/yvygyyth/net-vert)

---

## ✨ 核心特性

✅ **依赖倒置设计** - 解耦网络层，按需注入 axios、fetch 或自定义请求器  
✅ **中间件扩展** - 内置缓存、幂等、重试、并发控制、同步模式等强大中间件  
✅ **类型安全** - TypeScript 全类型提示，开发体验丝滑  
✅ **零配置上手** - API 极简，开箱即用  
✅ **灵活组合** - 多种中间件自由组合，满足复杂业务场景  
✅ **Tree-Shaking** - 支持按需引入，打包体积更小

---

## 📦 安装

```bash
npm install @net-vert/core
```

或者使用其他包管理器：

```bash
pnpm add @net-vert/core
# 或
yarn add @net-vert/core
```

---

## 🚀 快速上手

### 1️⃣ 注入请求器

首先，将你的请求函数注入到 `@net-vert/core`。这个函数接收请求配置，返回一个 Promise：

```typescript
import { inject } from '@net-vert/core'

// 创建一个简单的请求函数
const myRequestor = (config) => {
  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    // 这里可以是任何异步请求实现
    // 例如：fetch、axios、小程序的 wx.request 等
    fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined
    })
      .then(res => res.json())
      .then(data => resolve(data))
      .catch(err => reject(err))
  })
}

// 注入到 net-vert
inject(myRequestor)
```

> **提示**：你可以注入任何符合请求器签名 `(config) => Promise` 的函数，包括 axios、fetch 或自定义请求实现。

### 2️⃣ 发起请求

注入完成后，使用 `useRequestor` 或 `createRequestor` 创建请求器：

#### 基础用法

```typescript
import { useRequestor } from '@net-vert/core'

const requestor = useRequestor()

// GET 请求
requestor.get('/user/info', { params: { id: 1 } }).then(console.log)

// POST 请求
requestor.post('/user/create', { name: 'Alice' }).then(console.log)

// PUT 请求
requestor.put('/user/update', { id: 1, name: 'Bob' })

// DELETE 请求
requestor.delete('/user/delete', { params: { id: 1 } })
```

---

## 🛠 中间件系统

`@net-vert/core` 的强大之处在于其中间件系统。你可以通过 `createRequestor` 结合各种中间件来扩展请求能力。

### 核心 API：`createRequestor`

```typescript
import { createRequestor, cache, idempotent } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [
    idempotent(),              // 防止并发重复请求
    cache({ duration: 5000 })  // 缓存 5 秒
  ]
})

// 使用增强后的请求器
requestor.get('/api/data')
```

---

## 📚 内置中间件

### 1. 缓存中间件 (`cache`)

为请求结果添加缓存能力，避免重复请求相同数据。

#### 基础用法

```typescript
import { createRequestor, cache } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [
    cache({ 
      duration: 5000  // 缓存 5 秒
    })
  ]
})

// 首次请求会发起网络请求
await requestor.get('/api/users')

// 5 秒内的相同请求会直接返回缓存
await requestor.get('/api/users')  // 使用缓存
```

#### 配置选项

```typescript
interface CacheOptions<D = any, R = any> {
  /**
   * 缓存 key 生成函数
   * 默认：基于 method + url + params 生成哈希
   */
  key?: (ctx: { config: RequestConfig<D> }) => string

  /**
   * 缓存有效期（毫秒）
   * - number: 固定时长
   * - function: 动态计算（可根据响应内容决定缓存时长）
   */
  duration?: number | ((ctx: { 
    key: string
    config: RequestConfig<D>
    response: R 
  }) => number)

  /**
   * 是否持久化到 IndexedDB 或 localStorage
   * 默认：false（仅内存缓存）
   */
  persist?: boolean

  /**
   * 缓存有效性校验函数
   * 返回 false 则忽略缓存，重新请求
   */
  isValid?: (ctx: {
    key: string
    config: RequestConfig<D>
    cachedData?: ExpirableValue<R>
  }) => boolean | Promise<boolean>
}
```

#### 高级示例

**自定义缓存 key**

```typescript
const requestor = createRequestor({
  extensions: [
    cache({
      duration: 5000,
      // 只根据 URL 生成 key，忽略参数差异
      key: ({ config }) => `custom_${config.url}`
    })
  ]
})

// 这两个请求会共享缓存（因为 URL 相同）
await requestor.get('/api/users', { params: { id: 1 } })
await requestor.get('/api/users', { params: { id: 2 } })  // 使用缓存
```

**动态缓存时长**

```typescript
const requestor = createRequestor({
  extensions: [
    cache({
      // 根据响应内容决定缓存时长
      duration: ({ response }) => {
        // 如果数据标记为"静态"，缓存 1 小时
        if (response.isStatic) {
          return 60 * 60 * 1000
        }
        // 否则缓存 5 秒
        return 5000
      }
    })
  ]
})
```

**自定义缓存有效性校验**

```typescript
let userLoggedOut = false

const requestor = createRequestor({
  extensions: [
    cache({
      duration: 10000,
      // 用户登出后使所有缓存失效
      isValid: ({ cachedData }) => {
        if (userLoggedOut) return false
        return true
      }
    })
  ]
})
```

**持久化缓存**

```typescript
const requestor = createRequestor({
  extensions: [
    cache({
      duration: 24 * 60 * 60 * 1000,  // 缓存 24 小时
      persist: true  // 持久化到 IndexedDB/localStorage
    })
  ]
})
```

#### 手动操作缓存

缓存中间件暴露了 `storage` 属性，允许你手动操作缓存：

```typescript
const cacheMiddleware = cache({ duration: 5000 })

const requestor = createRequestor({
  extensions: [cacheMiddleware]
})

// 清空所有缓存
cacheMiddleware.storage.clear()

// 获取缓存项
const cached = cacheMiddleware.storage.getItem('/api/users')

// 删除特定缓存
cacheMiddleware.storage.removeItem('/api/users')

// 手动设置缓存
cacheMiddleware.storage.set('/api/users', { data: [...] })
```

---

### 2. 幂等中间件 (`idempotent`)

防止相同的请求并发执行，确保在前一个请求完成前，后续相同请求返回同一个 Promise。

#### 基础用法

```typescript
import { createRequestor, idempotent } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [idempotent()]
})

// 并发发起两个相同请求
const promise1 = requestor.get('/api/users')
const promise2 = requestor.get('/api/users')

// promise1 和 promise2 是同一个 Promise 实例
console.log(promise1 === promise2)  // true

// 只会发起一次网络请求
const [result1, result2] = await Promise.all([promise1, promise2])
```

#### 配置选项

```typescript
interface IdempotencyOptions<D = any> {
  /**
   * 自定义请求唯一标识生成函数
   * 默认：基于 method + url + params 生成哈希
   */
  genKey?: (config: RequestConfig<D>) => string
}
```

#### 高级示例

```typescript
const requestor = createRequestor({
  extensions: [
    idempotent({
      // 自定义 key 生成逻辑
      genKey: (config) => `${config.method}:${config.url}`
    })
  ]
})
```

#### 与缓存组合使用

幂等中间件通常与缓存中间件配合使用，实现"短期防重复 + 长期缓存"：

```typescript
const requestor = createRequestor({
  extensions: [
    idempotent(),              // 防止并发重复（短期）
    cache({ duration: 5000 })  // 缓存结果（长期）
  ]
})
```

---

### 3. 重试中间件 (`retry`)

当请求失败时自动重试，支持固定延迟、指数退避等策略。

#### 基础用法

```typescript
import { createRequestor, retry } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [
    retry({ 
      retries: 3,    // 最多重试 3 次
      delay: 1000    // 每次重试延迟 1 秒
    })
  ]
})

// 失败后会自动重试最多 3 次
await requestor.get('/api/unstable-endpoint')
```

#### 配置选项

```typescript
interface RetryOptions<D = any> {
  /**
   * 最大重试次数
   * 默认：3
   */
  retries?: number

  /**
   * 重试延迟（毫秒）
   * - number: 固定延迟
   * - function: 动态延迟（实现指数退避等策略）
   * 默认：0
   */
  delay?: number | ((ctx: {
    config: RequestConfig<D>
    lastResponse: any
    attempt: number
  }) => number)

  /**
   * 重试条件判断函数
   * 返回 true 则重试，false 则直接抛出错误
   * 默认：所有错误都重试
   */
  retryCondition?: (ctx: {
    config: RequestConfig<D>
    lastResponse: any
    attempt: number
  }) => boolean
}
```

#### 高级示例

**指数退避重试**

```typescript
const requestor = createRequestor({
  extensions: [
    retry({
      retries: 5,
      // 指数退避：第 n 次重试延迟 2^n * 100ms
      delay: ({ attempt }) => Math.pow(2, attempt) * 100
    })
  ]
})
```

**条件重试（仅 5xx 错误）**

```typescript
const requestor = createRequestor({
  extensions: [
    retry({
      retries: 3,
      delay: 1000,
      // 只在服务器错误时重试
      retryCondition: ({ lastResponse }) => {
        const status = lastResponse?.response?.status
        return status >= 500 && status < 600
      }
    })
  ]
})
```

---

### 4. 并发控制中间件 (`concurrent`)

限制同时发起的请求数量，适用于批量请求场景。

#### 基础用法

```typescript
import { createRequestor, concurrent } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [
    concurrent({ 
      parallelCount: 3  // 最多同时 3 个请求
    })
  ]
})

// 发起 10 个请求，但同时只会执行 3 个
const promises = []
for (let i = 0; i < 10; i++) {
  promises.push(requestor.get(`/api/data/${i}`))
}
await Promise.all(promises)
```

#### 配置选项

```typescript
interface ConcurrentOptions<D = any> {
  /**
   * 最大并行请求数
   * 默认：4
   */
  parallelCount?: number

  /**
   * 任务唯一标识生成函数
   * 默认：基于时间戳 + 随机数
   */
  createId?: (config: RequestConfig<D>) => string | number
}
```

#### 高级示例

```typescript
const requestor = createRequestor({
  extensions: [
    concurrent({
      parallelCount: 5,
      // 使用请求 URL 作为任务 ID
      createId: ({ config }) => config.url
    })
  ]
})
```

#### 与重试组合使用

```typescript
const requestor = createRequestor({
  extensions: [
    concurrent({ parallelCount: 3 }),  // 限制并发数
    retry({ retries: 2, delay: 500 })   // 失败重试
  ]
})

// 批量请求，每个请求都有重试保护
const results = await Promise.all(
  urls.map(url => requestor.get(url))
)
```

---

### 5. 同步模式中间件 (`sync`)

让异步请求支持"Suspense 风格"的同步调用，适用于 React Suspense 等场景。

> **⚠️ 重要**：`sync` 中间件**必须放在中间件数组的第一位**，否则会导致功能异常。详见 [中间件顺序规则](#️-重要中间件顺序规则)。

#### 基础用法（Suspense 模式）

```typescript
import { createRequestor, sync } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [sync()]
})

// 首次调用会抛出 Promise（触发 Suspense）
try {
  const data = requestor.get('/api/users')
} catch (promise) {
  await promise  // 等待数据加载
}

// 再次调用会同步返回缓存数据
const data = requestor.get('/api/users')  // 同步返回，不再抛出
console.log(data)  // 直接获取数据
```

#### React Suspense 集成

```tsx
import { createRequestor, sync } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [sync()]
})

function UserProfile({ userId }) {
  // 首次渲染会抛出 Promise，触发 Suspense
  // 数据加载完成后重新渲染，此时同步返回数据
  const user = requestor.get(`/api/users/${userId}`)
  
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  )
}
```

#### 配置选项

```typescript
interface SyncOptions<D = any, R = any> {
  /**
   * 缓存 key 生成函数
   * 默认：基于 method + url + params 生成
   */
  key?: (ctx: { config: RequestConfig<D> }) => string

  /**
   * 是否启用 Suspense 模式（抛出 Promise）
   * - true: 首次调用抛出 Promise（默认）
   * - false: 首次调用返回 Promise
   */
  suspense?: boolean

  /**
   * 自定义 Promise 包装函数
   * 可用于添加元数据或修改返回结构
   */
  wrapSuspense?: (params: {
    key: string
    config: RequestConfig<D>
    p: Promise<R>
  }) => Promise<R>

  /**
   * 缓存有效期（毫秒）
   * 默认：永久缓存
   */
  duration?: number

  /**
   * 是否持久化
   * 默认：false
   */
  persist?: boolean
}
```

#### 高级示例

**非 Suspense 模式**

```typescript
const requestor = createRequestor({
  extensions: [
    sync({ suspense: false })  // 关闭 Suspense 模式
  ]
})

// 首次调用返回 Promise
const promise = requestor.get('/api/users')
await promise

// 再次调用同步返回缓存
const data = requestor.get('/api/users')  // 同步返回
```

**自定义 Promise 包装**

```typescript
const requestor = createRequestor({
  extensions: [
    sync({
      wrapSuspense: ({ p, key }) => {
        // 给 Promise 添加元数据
        return p.then(data => ({
          ...data,
          __cacheKey: key,
          __timestamp: Date.now()
        }))
      }
    })
  ]
})
```

---

## 🔗 中间件组合

多个中间件可以自由组合，执行顺序遵循数组顺序：

```typescript
const requestor = createRequestor({
  extensions: [
    idempotent(),                      // 1. 防止并发重复
    cache({ duration: 5000 }),         // 2. 缓存结果
    retry({ retries: 3, delay: 1000 }), // 3. 失败重试
    concurrent({ parallelCount: 3 })   // 4. 限制并发
  ]
})
```

### ⚠️ 重要：中间件顺序规则

在组合中间件时，需要注意以下**强制性规则**，否则会导致功能异常：

1. **同步模式中间件（`sync`）必须放在第一位**
   ```typescript
   // ✅ 正确
   const requestor = createRequestor({
     extensions: [
       sync(),                        // 必须第一个
       idempotent(),
       cache({ duration: 5000 })
     ]
   })
   
   // ❌ 错误 - 某些情况下 sync 不在第一位会导致同步调用失败，幂等缓存的promise会被sync模块直接改变，导致幂等缓存失效.重试也会因为同步模块抛错误耗尽失败次数，同步模块的同步能力也可能因为部分中间件的异步特性而失效
   const requestor = createRequestor({
     extensions: [
       retry() | idempotent(),
       sync()                        // 错误位置！
     ]
   })
   ```

2. **自定义中间件如果需要拦截所有请求，必须前置**
   
   自定义中间件的位置决定了它在中间件链中的执行时机：
   - **前置**：可以拦截和修改所有请求（包括被其他中间件处理的请求）
   - **后置**：只能处理未被前面中间件拦截的请求（如缓存命中的请求不会到达后置中间件）

   ```typescript
   const loggerMiddleware: Middleware = async ({ config, next }) => {
     console.log('Request:', config.url)
     return await next()
   }
   
   // ✅ 正确 - logger 在最前面，可以记录所有请求
   const requestor = createRequestor({
     extensions: [
       loggerMiddleware,              // 第一个执行
       cache({ duration: 5000 }),
       retry({ retries: 3 })
     ]
   })
   
   // ⚠️ 注意 - logger 在 cache 之后，缓存命中的请求不会被记录
   const requestor = createRequestor({
     extensions: [
       cache({ duration: 5000 }),
       loggerMiddleware,              // 缓存命中时不会执行
       retry({ retries: 3 })
     ]
   })
   ```

3. **推荐的中间件顺序**（从前到后）：
   - `sync()` - 同步模式（如果使用）
   - 自定义拦截中间件（日志、鉴权等）
   - `idempotent()` - 幂等处理
   - `cache()` - 缓存
   - `retry()` - 重试
   - `concurrent()` - 并发控制

### 常见组合模式

#### 1. 数据查询场景（幂等 + 缓存）

```typescript
const requestor = createRequestor({
  extensions: [
    idempotent(),              // 防止并发重复请求
    cache({ duration: 5000 })  // 缓存 5 秒
  ]
})
```

#### 2. 批量请求场景（并发控制 + 重试）

```typescript
const requestor = createRequestor({
  extensions: [
    concurrent({ parallelCount: 5 }),  // 最多同时 5 个请求
    retry({ retries: 3, delay: 500 })   // 失败重试 3 次
  ]
})
```

#### 3. 全能组合（适用于复杂场景）

```typescript
const requestor = createRequestor({
  extensions: [
    idempotent(),                         // 1. 防止并发重复
    cache({ 
      duration: 10000, 
      persist: true                       // 2. 持久化缓存 10 秒
    }),
    retry({ 
      retries: 3, 
      delay: ({ attempt }) => Math.pow(2, attempt) * 100  // 3. 指数退避重试
    }),
    concurrent({ parallelCount: 3 })      // 4. 限制并发数
  ]
})
```

---

## 🎯 便捷组合方法

为常见场景提供了预设组合：

### `createCachedIdempotentRequestor`

创建带缓存和幂等的请求器，适用于数据查询接口。

```typescript
import { createCachedIdempotentRequestor } from '@net-vert/core'

const requestor = createCachedIdempotentRequestor({
  duration: 5000,  // 缓存 5 秒
  persist: false,  // 不持久化
  // 支持所有 cache 和 idempotent 的配置项
})

// 等价于：
// createRequestor({
//   extensions: [
//     idempotent(),
//     cache({ duration: 5000, persist: false })
//   ]
// })
```

### `createConcurrentRetryRequestor`

创建带并发控制和重试的请求器，适用于批量请求场景。

```typescript
import { createConcurrentRetryRequestor } from '@net-vert/core'

const requestor = createConcurrentRetryRequestor({
  parallelCount: 5,  // 最多 5 个并发
  retries: 3,        // 重试 3 次
  delay: 1000        // 每次延迟 1 秒
})

// 等价于：
// createRequestor({
//   extensions: [
//     concurrent({ parallelCount: 5 }),
//     retry({ retries: 3, delay: 1000 })
//   ]
// })
```

---

## 🔑 多实例管理

支持注入和管理多个请求器实例：

```typescript
import { inject, createRequestor } from '@net-vert/core'

// 注入主实例（默认）
inject(axiosAdapter)

// 注入备用实例
inject(fetchAdapter, 'backup')

// 使用默认实例
const requestor1 = createRequestor()

// 使用备用实例
const requestor2 = createRequestor({ instanceKey: 'backup' })
```

---

## 📘 API 参考

### 核心 API

#### `inject(requestor, instanceKey?)`

注入请求器到全局容器。

- **requestor**: `(config: RequestConfig) => Promise<any>` - 请求器函数
- **instanceKey**: `string | symbol` - 实例标识（可选，默认为 `'default'`）

#### `useRequestor(instanceKey?)`

获取已注入的请求器。

- **instanceKey**: `string | symbol` - 实例标识（可选）
- **返回**: `Requestor` - 请求器对象

#### `createRequestor(config?)`

创建带中间件的请求器。

- **config.extensions**: `Middleware[]` - 中间件数组
- **config.instanceKey**: `string | symbol` - 使用的请求器实例标识
- **返回**: `Requestor` - 增强后的请求器

### Requestor 接口

```typescript
interface Requestor {
  request<R = any, D = any>(config: RequestConfig<D>): Promise<R>
  get<R = any, D = any>(url: string, config?: Omit<RequestConfig<D>, 'method' | 'url'>): Promise<R>
  post<R = any, D = any>(url: string, data?: D, config?: Omit<RequestConfig<D>, 'method' | 'url'>): Promise<R>
  put<R = any, D = any>(url: string, data?: D, config?: Omit<RequestConfig<D>, 'method' | 'url'>): Promise<R>
  delete<R = any, D = any>(url: string, config?: Omit<RequestConfig<D>, 'method' | 'url'>): Promise<R>
}
```

---

## 🎨 完整示例

### 示例 1：典型的前端应用配置

```typescript
import axios from 'axios'
import { inject, createRequestor, idempotent, cache, retry } from '@net-vert/core'

// 1. 创建并注入 axios 实例
const instance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000
})
inject(config => instance.request(config))

// 2. 创建数据查询请求器（带缓存和幂等）
export const queryRequestor = createRequestor({
  extensions: [
    idempotent(),
    cache({ 
      duration: 30000,    // 缓存 30 秒
      persist: true       // 持久化
    })
  ]
})

// 3. 创建数据变更请求器（带重试）
export const mutationRequestor = createRequestor({
  extensions: [
    retry({ 
      retries: 3, 
      delay: ({ attempt }) => Math.pow(2, attempt) * 200,
      retryCondition: ({ lastResponse }) => {
        // 只在网络错误或 5xx 时重试
        const status = lastResponse?.response?.status
        return !status || (status >= 500 && status < 600)
      }
    })
  ]
})

// 4. 使用
async function fetchUserProfile(userId: number) {
  return queryRequestor.get(`/users/${userId}`)
}

async function updateUserProfile(userId: number, data: any) {
  return mutationRequestor.put(`/users/${userId}`, data)
}
```

### 示例 2：批量文件上传

```typescript
import { createRequestor, concurrent, retry } from '@net-vert/core'

const uploadRequestor = createRequestor({
  extensions: [
    concurrent({ parallelCount: 3 }),  // 同时最多 3 个上传
    retry({ retries: 2, delay: 1000 }) // 失败重试 2 次
  ]
})

async function uploadFiles(files: File[]) {
  const tasks = files.map(file => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadRequestor.post('/upload', formData)
  })
  
  return Promise.all(tasks)
}
```

### 示例 3：React Suspense 集成

```tsx
import { inject, createRequestor, sync } from '@net-vert/core'
import { Suspense } from 'react'

// 注入请求器
inject(config => fetch(config.url).then(res => res.json()))

// 创建 Suspense 风格的请求器
const suspenseRequestor = createRequestor({
  extensions: [sync()]
})

// API 封装
const api = {
  getUser: (id: number) => suspenseRequestor.get(`/api/users/${id}`),
  getPosts: () => suspenseRequestor.get('/api/posts')
}

// 组件
function UserProfile({ userId }: { userId: number }) {
  const user = api.getUser(userId)  // 首次会触发 Suspense
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  )
}
```

---

## 🔧 高级用法

### 自定义中间件

你可以编写自己的中间件来扩展功能：

```typescript
import { createRequestor, type Middleware } from '@net-vert/core'

// 自定义日志中间件
const loggerMiddleware: Middleware = async ({ config, next }) => {
  console.log('Request:', config.method, config.url)
  const startTime = Date.now()
  
  try {
    const result = await next()
    console.log('Success:', Date.now() - startTime, 'ms')
    return result
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// 使用自定义中间件
const requestor = createRequestor({
  extensions: [loggerMiddleware]
})
```

> **⚠️ 重要提示**：如果你的自定义中间件需要拦截所有请求（如日志记录、鉴权检查等），**必须将其放在中间件数组的最前面**（`sync` 除外）。否则，被前置中间件（如 `cache`）拦截的请求不会经过你的自定义中间件。详见 [中间件顺序规则](#️-重要中间件顺序规则)。

### 动态切换请求器

```typescript
import { inject, useRequestor } from '@net-vert/core'

// 注入多个请求器
inject(axiosAdapter, 'axios')
inject(fetchAdapter, 'fetch')

// 动态选择
function getRequestor(type: 'axios' | 'fetch') {
  return useRequestor(type)
}

// 使用
const requestor = getRequestor('axios')
requestor.get('/api/data')
```

---

## 🧪 测试支持

轻松进行单元测试：

```typescript
import { inject, createRequestor, cache } from '@net-vert/core'
import { vi } from 'vitest'

describe('API Tests', () => {
  it('should cache requests', async () => {
    // 创建 mock 请求器
    const mockRequestor = vi.fn(async (config) => ({
      code: 200,
      data: { url: config.url }
    }))
    
    inject(mockRequestor)
    
    const requestor = createRequestor({
      extensions: [cache({ duration: 5000 })]
    })
    
    // 发起两次相同请求
    await requestor.get('/api/test')
    await requestor.get('/api/test')
    
    // 验证只调用了一次
    expect(mockRequestor).toHaveBeenCalledTimes(1)
  })
})
```

---

## 📤 项目信息

- **仓库地址**: [https://github.com/yvygyyth/net-vert](https://github.com/yvygyyth/net-vert)
- **问题反馈**: [GitHub Issues](https://github.com/yvygyyth/net-vert/issues)
- **许可证**: MIT
- **作者**: yuzinan <1589937631@qq.com>

---

## 💡 设计理念

1. **依赖倒置** - 网络层完全解耦，未来可自由切换底层实现
2. **组合优于继承** - 通过中间件组合实现复杂功能
3. **渐进式增强** - 零配置可用，按需添加能力
4. **类型安全** - 完整的 TypeScript 支持
5. **轻量纯粹** - 核心代码极简，扩展独立管理

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📝 更新日志

### v1.0.0 (2024-11)

- 🎉 正式版本发布
- ✨ 完整的中间件系统
- ✨ 支持缓存、幂等、重试、并发控制、同步模式
- ✨ 完整的 TypeScript 类型支持
- ✨ 支持多实例管理
- 📚 完善的文档和示例

---

如有任何问题或建议，欢迎在 [GitHub](https://github.com/yvygyyth/net-vert) 上联系我们！
