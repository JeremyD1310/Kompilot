import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { blinkTaggerPlugin } from './blink-tagger.plugin.mjs'; // BLINK_TAGGER_HASH:049a079d501a
export default defineConfig({
  plugins: [blinkTaggerPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/analytics',
      'firebase/firestore',
      'firebase/messaging',
      'react',
      'react-dom',
      'react/jsx-runtime',
      'framer-motion',
    ],
  },
    server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
  }
});