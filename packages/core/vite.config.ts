import { defineConfig } from 'vite'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: 'src/index',
      name: 'net-vert/core',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['id-queue', 'localforage'], // 关键配置
      output: {
        globals: {
          'id-queue': 'idQueue',
          'localforage': 'localforage'
        }
      }
    }
  },
  plugins: [
    dts({
      tsconfigPath: 'tsconfig.app.json',
      // include: 'src/index',
      exclude: ['**/node_modules'],
      copyDtsFiles: true,
      rollupTypes: true
    })
  ],
  base: '/'
})
