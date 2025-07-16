import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**/*.ts'],
      reporter: ['text', 'json', 'html']
    },
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    testTimeout: 15000,
    hookTimeout: 15000
  }
});