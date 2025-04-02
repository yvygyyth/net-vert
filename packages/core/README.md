
---

# @net-vert/core

**轻量级依赖倒置网络请求库，专为扩展和易用而设计。**

GitHub 开源仓库 👉 [https://github.com/yvygyyth/net-vert](https://github.com/yvygyyth/net-vert)

---

## ✨ 核心特性

✅ 解耦网络层，按需注入 axios、fetch 或自定义请求器  
✅ 支持缓存、幂等、重试等扩展  
✅ TypeScript 全类型提示，开发更丝滑  
✅ 内置幂等、缓存、重试等扩展
✅ 零配置上手，API 极简  

---

## 📦 安装

```bash
npm install @net-vert/core
```

---

## 🚀 快速上手

### 1️⃣ 注入请求器（以 axios 为例）

```typescript
import axios from 'axios';
import { inject, useRequestor } from '@net-vert/core';

const instance = axios.create({ baseURL: '/api', timeout: 60000 });
const axiosAdapter = (config) => instance.request(config);

inject(axiosAdapter); // 注入 axios 实例
```

---

### 2️⃣ 发起请求

```typescript
const requestor = useRequestor();

requestor.get('/user/info', { params: { id: 1 } }).then(console.log);
requestor.post('/user/create', { name: 'Alice' }).then(console.log);
```

---

## 🛠 扩展能力（requestExtender）

### 缓存请求器（cacheRequestor）
```typescript
interface CacheConfig {
  key?: (config: UnifiedConfig) => string
  duration?: number | ({ key, config, response }) => number
  persist?: boolean
  sync?: boolean
  isValid?: ({ key, config, cachedData }) => boolean | Promise<boolean>
}
```
- **key**：缓存键生成函数（默认使用URL+参数哈希）
- **duration**：缓存时长(ms)，支持动态计算过期时间
- **persist**：是否持久化到indexdeeb, localStorage(同步模式只能存储到localStorage)
- **sync**：是否启用同步模式
- **isValid**：缓存有效性校验函数(同步模式只能传入同步校验函数)

### 幂等请求器（idempotencyRequestor）
```typescript
(genKey?: (config) => string)
```
- **genKey**：自定义请求唯一标识生成函数（默认使用method+url+参数哈希）

### 同步请求器（syncRequestor）
```typescript
{
  persist?: false
  sync?: true
}
```
入参与 cacheRequestor 一致,不能采用异步方案,第一次请求自动报错，之后再次请求均可同步获取

### 并发池请求器（concurrentPoolRequestor）
```typescript
{
  parallelCount?: number;
  createId?: (config: UnifiedConfig) => string
}
```
- **maxConcurrent**：最大并行请求数量,默认为4
- **createId**：任务唯一标识生成函数（默认使用时间加随机数）
其他参数继承于重试请求器

### 重试请求器（retryRequestor）
```typescript
{
  retries?: number
  delay?: number | (attempt: number) => number
  retryCondition?: (error: any) => boolean
}
```
- **retries**：最大重试次数（默认3次）
- **delay**：重试延迟时间，支持固定数值或动态计算函数
- **retryCondition**：触发重试的条件判断函数


```typescript
import { requestExtender } from '@net-vert/core';
```

✅ **缓存请求例子**
```typescript
const {requestor} = requestExtender.cacheRequestor();
requestor.get('/user/info', { params: { id: 1 } });
```


## 📤 开源信息

- 仓库地址：[https://github.com/yvygyyth/net-vert](https://github.com/yvygyyth/net-vert)
- 许可证：MIT
- 支持 Tree-Shaking
- 无副作用 (`sideEffects: false`)

---

## 🔥 设计理念

- 网络层完全解耦，未来自由扩展
- 内置强大的请求能力，零上手成本
- 存储与缓存拆分，保持核心轻量纯粹

---

如果你确定了包名是 `@net-vert/cache`，我可以直接帮你生成一段未来文档里的“缓存插件使用示例”，随时告诉我！