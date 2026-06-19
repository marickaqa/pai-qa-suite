import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@utils': path.resolve(__dirname, './utils'),
    },
  },
  test: {
    testTimeout: 300000,
    retry: 1,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    include: ['tests/core/api/**/*.spec.ts'],
    globalSetup: './vitest.global-setup.ts',
  }
})