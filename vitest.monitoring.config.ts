import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    retry: 0,
    include: ['tests/monitoring/**/*.spec.ts']
  }
})