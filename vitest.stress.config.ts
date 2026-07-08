import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/stress/**/*.spec.ts'],
    globalSetup: './vitest.global-setup.ts',
    testTimeout: 180000,
    hookTimeout: 60000,
    reporters: ['verbose'],
  }
})