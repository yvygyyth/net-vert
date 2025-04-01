import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'
import tsconfigPaths from 'vite-tsconfig-paths'

export default mergeConfig(viteConfig, defineConfig({
  test: {

  },
  plugins: [
    tsconfigPaths()
  ]
}))