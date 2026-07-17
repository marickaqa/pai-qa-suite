import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    retry: 0,
    include: ['tests/known-bugs/api/**/*.spec.ts'],
    globalSetup: './vitest.guard-setup.ts',
  }
})
