import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const nodeModules = /node_modules/;

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/mainApp-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/,
              priority: 50,
            },
            {
              name: 'icons',
              test: /node_modules[\\/]@mui[\\/]icons-material[\\/]/,
              priority: 40,
            },
            {
              name: 'mui',
              test: /node_modules[\\/](@mui[\\/](?!icons-material)|@emotion[\\/]|@popperjs[\\/])/,
              priority: 30,
            },
            {
              name: 'otherLibs',
              test: nodeModules,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 4991,
    proxy: {
      '/api': 'http://127.0.0.1:3991',
    },
  },
  preview: {
    port: 4991,
    proxy: {
      '/api': 'http://127.0.0.1:3991',
    },
  },
});
