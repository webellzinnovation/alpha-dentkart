import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{js,ts,jsx,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['functions/**', 'node_modules/**', '.opencode/**', '.playwright-mcp/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['utils/**', 'hooks/**', 'components/**', 'src/**'],
      exclude: ['**/*.test.*', '**/*.config.*', '**/node_modules/**'],
      thresholds: {
        statements: 50,
        branches: 30,
        functions: 50,
        lines: 50,
      },
    },
  },
});
