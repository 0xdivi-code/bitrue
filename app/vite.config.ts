import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // venue-scoped ccxt imports (package exports map only exposes the root)
      { find: 'ccxt-venue/pro/binance', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/pro/binance.js') },
      { find: 'ccxt-venue/pro/bybit', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/pro/bybit.js') },
      { find: 'ccxt-venue/pro/okx', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/pro/okx.js') },
      { find: 'ccxt-venue/binance', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/binance.js') },
      { find: 'ccxt-venue/bybit', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/bybit.js') },
      { find: 'ccxt-venue/okx', replacement: path.resolve(__dirname, 'node_modules/ccxt/js/src/okx.js') },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
