import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: path('./src') },
      // Contract shared with the Supabase edge functions (single source of truth).
      { find: /^@ai-contract$/, replacement: path('./supabase/functions/_shared/ai-schemas.ts') },
      { find: /^@ai-contract\/vocabulary$/, replacement: path('./supabase/functions/_shared/vocabulary.ts') },
    ],
  },
  build: {
    target: 'es2022',
    sourcemap: 'hidden',
  },
});
