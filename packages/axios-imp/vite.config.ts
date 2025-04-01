import { defineConfig } from 'vite'
import path from 'path'
import dts from 'vite-plugin-dts'


export default defineConfig({
  resolve: {
    alias: {
      '@net-vert': path.resolve(__dirname, '../../packages'),
      '@': path.resolve(__dirname, '../../packages/core/src'),
    }
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: 'src/index',
      name: 'domToVue',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['axios'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'axios'
        },
      },
    },
  },
  plugins: [
    dts({
      tsconfigPath: 'tsconfig.app.json',
      // include: 'src/index',
      // exclude: ['**/*.spec.ts', '**/test-utils'],
      copyDtsFiles: true,
      rollupTypes: true
    })
  ]
})
