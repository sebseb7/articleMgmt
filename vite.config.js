import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = /node_modules/;

const prerenderActive = 'VITE_LOGIN_PRERENDER_ACTIVE';

const ssrNoExternal = [
  '@mui/material',
  '@mui/icons-material',
  '@mui/system',
  '@mui/utils',
  '@emotion/react',
  '@emotion/styled',
  '@emotion/cache',
  '@emotion/server',
  '@emotion/serialize',
  '@emotion/utils',
  '@emotion/hash',
  '@emotion/memoize',
  '@emotion/is-prop-valid',
  '@emotion/unitless',
  '@emotion/sheet',
  '@emotion/use-insertion-effect-with-fallbacks',
];

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
      if (process.env[prerenderActive]) return;

      const indexPath = path.resolve(__dirname, 'dist/index.html');
      if (!fs.existsSync(indexPath)) return;

      process.env[prerenderActive] = '1';
      const server = await createServer({
        root: __dirname,
        mode: 'production',
        plugins: [react()],
        resolve: {
          dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/cache', '@emotion/styled'],
        },
        ssr: {
          noExternal: ssrNoExternal,
        },
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
      });

      try {
        const { injectLoginShell } = await server.ssrLoadModule('/server/loginShell.js');
        const html = fs.readFileSync(indexPath, 'utf8');
        fs.writeFileSync(indexPath, injectLoginShell(html));
      } finally {
        await server.close();
        delete process.env[prerenderActive];
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), loginPrerenderPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/cache', '@emotion/styled'],
  },
  ssr: {
    noExternal: ssrNoExternal,
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
