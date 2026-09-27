import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            globals: true,
            environment: 'jsdom',
            include: ['src/**/*.test.{ts,tsx}'],
            setupFiles: ['./src/test/setup.ts'],
            env: {
              VITE_SUPABASE_URL: 'http://localhost:54321',
              VITE_SUPABASE_ANON_KEY: 'test-anon-key-000000000000',
            },
          },
        },
        {
          test: {
            name: 'db',
            environment: 'node',
            include: ['supabase/tests/**/*.test.ts'],
            testTimeout: 30_000,
            hookTimeout: 60_000,
          },
        },
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.*', 'src/shared/types/**', 'src/test/**'],
      },
    },
  }),
);
