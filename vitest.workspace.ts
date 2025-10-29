import { defineWorkspace } from 'vitest/config'

// Vitest Workspace 配置
// 这样可以在根目录运行任何子包的测试，每个子包使用自己的配置
export default defineWorkspace([
  'packages/core',
  // 'packages/axios-imp', // 暂时注释掉，因为缺少依赖
])

