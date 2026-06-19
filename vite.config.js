import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const nodeModules = /node_modules/;
const bundledLoginShell = path.resolve('dist/.ssr/loginShell.js');

async function loadInjectLoginShell(ctx) {
  if (fs.existsSync(bundledLoginShell)) {
    const mod = await import(pathToFileURL(bundledLoginShell).href);
    return mod.injectLoginShell;
  }
  if (ctx.server) {
    const mod = await ctx.server.ssrLoadModule('/server/loginShell.js');
    return mod.injectLoginShell;
  }
  return null;
}

function loginPrerenderPlugin() {
  return {
    name: 'login-prerender',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const injectLoginShell = await loadInjectLoginShell(ctx);
        return injectLoginShell ? injectLoginShell(html) : html;
      },
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
