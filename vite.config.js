import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { injectLoginShell } from './server/loginShell.js';

const nodeModules = /node_modules/;

function loginPrerenderPlugin() {
  return {
    name: 'login-prerender',
    transformIndexHtml(html) {
      return injectLoginShell(html);
    },
  };
}

export default defineConfig({
  plugins: [react(), loginPrerenderPlugin()],
  build: {
    chunkSizeWarningLimit: 700,
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
              name: 'agGrid',
              test: /node_modules[\\/](ag-grid-community|ag-grid-react|ag-charts-types)([\\/]|$)/,
              priority: 25,
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
  preview: {
    port: 4991,
    proxy: {
      '/api': 'http://127.0.0.1:3991',
    },
  },
  server: {
    port: Number(process.env.VITE_PORT) || 4991,
    proxy: {
      '/api': `http://127.0.0.1:${process.env.PORT || 3991}`,
    },
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**', '**/blob-report/**'],
    },
  },
});
