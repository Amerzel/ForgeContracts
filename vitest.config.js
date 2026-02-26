import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      thresholds: {
        lines: 70,
        functions: 45,
        branches: 75,
        statements: 70,
      },
    },
  },
});
