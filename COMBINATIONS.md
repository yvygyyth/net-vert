# 中间件组合推荐指南

本文档用于说明在 `net-vert` 中推荐的中间件组合方式。

## 为什么不再提供快捷组合 API

之前的快捷方法（例如 `createCachedIdempotentRequestor`、`createConcurrentRetryRequestor`）本质上只是对 `createRequestor` 的薄封装。

改为文档推荐后有几个好处：

- 组合关系更直观：中间件顺序一眼可见
- 可扩展性更好：新增业务中间件时无需等待新的快捷 API
- 行为更稳定：避免快捷方法与底层选项不同步

## 推荐写法

统一使用 `createRequestor({ extensions: [...] })`：

```typescript
import { createRequestor, idempotent, cache, retry, concurrent } from 'net-vert';

const requestor = createRequestor({
    extensions: [
        idempotent(),
        cache({ duration: 5000 }),
        retry({ retries: 2, delay: 300 }),
        concurrent({ parallelCount: 4 }),
    ],
});
```

## 常见场景

### 1) 查询接口：幂等 + 缓存

```typescript
import { createRequestor, idempotent, cache } from 'net-vert';

const queryRequestor = createRequestor({
    extensions: [
        idempotent(),
        cache({ duration: 5000 }),
    ],
});
```

### 2) 批量请求：并发控制 + 重试

```typescript
import { createRequestor, concurrent, retry } from 'net-vert';

const batchRequestor = createRequestor({
    extensions: [
        concurrent({ parallelCount: 5 }),
        retry({ retries: 3, delay: 500 }),
    ],
});
```

### 3) 多实例场景：按 key 组合

```typescript
import { inject, createRequestor, cache } from 'net-vert';

inject(mainAdapter);
inject(backupAdapter, 'backup');

const backupRequestor = createRequestor({
    instanceKey: 'backup',
    extensions: [cache({ duration: 3000 })],
});
```

## 组合顺序建议

`extensions` 的顺序就是执行顺序。建议按下面顺序组合：

1. 自定义通用中间件（日志、鉴权等）
2. `idempotent()`
3. `cache()`
4. `retry()`
5. `concurrent()`

## 迁移说明

如果你此前使用了快捷组合 API，可按下面方式迁移：

- `createCachedIdempotentRequestor(config)`  
  -> `createRequestor({ instanceKey: config.instanceKey, extensions: [idempotent(...), cache(...)] })`
- `createConcurrentRetryRequestor(config)`  
  -> `createRequestor({ instanceKey: config.instanceKey, extensions: [concurrent(...), retry(...)] })`

迁移后功能等价，但可读性和可维护性更高。
