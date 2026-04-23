# verify-release

根目录下统一的发布验证总目录，包含两个子目录：

- `dist-local`：测试本地 `dist` 产物
- `npm-install`：测试发布后 `npm i` 安装使用

## 目录结构

```text
verify-release/
  dist-local/
  npm-install/
```

## 使用方式

### 1) 本地 dist 产物验证

```bash
pnpm run build
cd verify-release/dist-local
npm run smoke
```

### 2) 发布后 npm 安装验证

```bash
cd verify-release/npm-install
npm i
npm run smoke
```

### 3) 验证指定线上版本

```bash
cd verify-release/npm-install
npm i net-vert@<version>
npm run smoke
```
