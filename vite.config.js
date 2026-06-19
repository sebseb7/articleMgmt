import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = /node_modules/;

function loginPrerenderPlugin() {
  return {
    name: 'login-prerender',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        if (!ctx.server) return html;
        const { injectLoginShell } = await ctx.server.ssrLoadModule('/server/loginShell.js');
        return injectLoginShell(html);
      },
    },
    async closeBundle() {
      const indexPath = path.resolve(__dirname, 'dist/index.html');
      if (!fs.existsSync(indexPath)) return;

      const server = await createServer({
        configFile: path.resolve(__dirname, 'vite.config.js'),
        server: { middlewareMode: true },
        appType: 'custom',
      });

      try {
        const { injectLoginShell } = await server.ssrLoadModule('/server/loginShell.js');
        const html = fs.readFileSync(indexPath, 'utf8');
        fs.writeFileSync(indexPath, injectLoginShell(html));
      } finally {
        await server.close();
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), loginPrerenderPlugin()],
  ssr: {
    noExternal: ['@mui/material', '@mui/icons-material', '@mui/system', '@mui/utils', '@emotion/react', '@emotion/styled', '@emotion/cache', '@emotion/server'],
  },
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
