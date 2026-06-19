import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: 'server/loginShell.js',
    outDir: 'dist/.ssr',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'loginShell.js',
      },
    },
  },
});
