# 类型系统简化迁移指南

## 📋 变更概述

为了简化类型系统，我们移除了 `sync` 中间件及其相关的复杂类型推导。

## 🗑️ 已移除

### 1. sync 中间件
- `sync()` 中间件不再导出
- Suspense 风格的同步调用已移除

### 2. 复杂类型系统
- ✅ 移除 `HasSyncMiddleware<T>` 类型
- ✅ 移除 `MaybePromise<IsSync, R>` 类型
- ✅ 移除 `Requestor<IsSync>` 泛型参数
- ✅ 移除 `Middleware<IsSync, D, R>` 的 `IsSync` 参数
- ✅ 移除 `createRequestor` 的复杂函数重载

## ✨ 简化后的类型

### Requestor 接口
```typescript
// 之前
interface Requestor<IsSync extends boolean = false> {
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => MaybePromise<IsSync, R>
    // ...
}

// 现在
interface Requestor {
    get: <R = any, D = any>(url: string, config?: WithoutMethod<D>) => Promise<R>
    // ...
}
```

### Middleware 类型
```typescript
// 之前
type Middleware<IsSync extends boolean = false, D = any, R = any> = (context: {
    config: RequestConfig<D>
    next: () => MaybePromise<IsSync, R>
    ctx: MiddlewareContext
}) => MaybePromise<IsSync, R>

// 现在
type Middleware<D = any, R = any> = (context: {
    config: RequestConfig<D>
    next: () => Promise<R>
    ctx: MiddlewareContext
}) => Promise<R>
```

### createRequestor
```typescript
// 之前
function createRequestor<const Extensions extends readonly Middleware[]>(
    config: CreateRequestorConfig<Extensions> & { extensions: Extensions }
): Requestor<HasSyncMiddleware<Extensions>>

// 现在
function createRequestor<const Extensions extends readonly Middleware[]>(
    config?: CreateRequestorConfig<Extensions>
): Requestor
```

## 🔄 迁移步骤

### 如果你使用了 sync 中间件

**之前的代码：**
```typescript
import { createRequestor, sync } from '@net-vert/core'

const requestor = createRequestor({
  extensions: [sync()]
})

// 同步调用
const data = requestor.get('/api/users')
```

**迁移方案 1：使用 async/await（推荐）**
```typescript
import { createRequestor } from '@net-vert/core'

const requestor = createRequestor()

// 使用 async/await
const data = await requestor.get('/api/users')
```

**迁移方案 2：如果需要 Suspense 风格，自行封装**
```typescript
import { createRequestor, cache } from '@net-vert/core'

const asyncRequestor = createRequestor({
  extensions: [cache({ duration: 5000 })]
})

// 创建同步风格的包装器（需要自己实现类似逻辑）
function createSuspenseWrapper(requestor: Requestor) {
  const cache = new Map()

  return {
    get: (url: string, config?: any) => {
      const key = `${url}-${JSON.stringify(config)}`
      if (cache.has(key)) {
        return cache.get(key)
      }

      const promise = requestor.get(url, config)
      promise.then(data => cache.set(key, data))
      throw promise // 触发 Suspense
    }
  } as any // 使用类型断言
}

const suspenseRequestor = createSuspenseWrapper(asyncRequestor)
```

### 如果你只使用了其他中间件

**无需修改！** 你的代码将继续正常工作：

```typescript
import { createRequestor, cache, idempotent, retry } from '@net-vert/core'

// 这些代码完全兼容，无需修改
const requestor = createRequestor({
  extensions: [
    idempotent(),
    cache({ duration: 5000 }),
    retry({ retries: 3 })
  ]
})

await requestor.get('/api/data')
```

## 📈 改进效果

### 类型复杂度降低

- **Requestor 接口**：从 `Requestor<IsSync>` 简化为 `Requestor`
- **Middleware 类型**：减少一个泛型参数
- **类型推导**：无需 `HasSyncMiddleware` 递归遍历
- **编译速度**：类型检查更快

### 代码量减少

- 删除 ~150 行复杂类型代码
- 删除 ~200 行文档
- 减少 3 个函数重载

## ❓ 常见问题

### Q: 为什么要移除 sync 中间件？

A: sync 中间件导致类型系统复杂度大幅增加（3-5倍），但只服务于小众的 Suspense 场景。现代 React 有更好的解决方案（如 `use()` hook），移除后类型系统更简单、更易维护。

### Q: 我需要 Suspense 怎么办？

A: 你可以在业务层自行封装一个简单的同步包装器，使用 `as` 类型断言。或者使用 React 19+ 的 `use()` hook。

### Q: 这是 Breaking Change 吗？

A: 是的。如果你使用了 `sync()` 中间件，需要按照上述迁移方案修改代码。如果只使用其他中间件，则无需修改。

## 📝 版本信息

- 此变更将在下一个 **major 版本**发布
- 建议在升级前查看此迁移指南
- 如有问题，请在 GitHub Issues 反馈

---

**如有疑问，欢迎在 [GitHub](https://github.com/yvygyyth/net-vert) 提 Issue！**

