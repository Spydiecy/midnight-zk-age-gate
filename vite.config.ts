import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    wasm(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('onchain-runtime-v3')) return 'wasm';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
    ],
    include: ['@midnight-ntwrk/compact-runtime'],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
  },
  define: {
    // Inject network env vars
    'import.meta.env.VITE_NETWORK_ID': JSON.stringify(mode === 'preprod' ? 'preprod' : mode === 'preview' ? 'preview' : 'preprod'),
    'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(process.env.VITE_CONTRACT_ADDRESS ?? ''),
  },
}));
