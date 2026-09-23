import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests share one database; run files serially.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/server/**/*.ts', 'src/lib/contracts.ts'],
      exclude: ['src/server/db/seed.ts', 'src/server/db/migrate.ts'],
      reporter: ['text-summary', 'html', 'lcov'],
    },
  },
});
