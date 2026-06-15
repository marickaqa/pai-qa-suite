import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    retry: 1,
    include: ['tests/core/api/**/*.spec.ts']
  }
})