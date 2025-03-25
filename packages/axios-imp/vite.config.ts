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
      name: 'domToVue',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es', 'umd']
    }
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
