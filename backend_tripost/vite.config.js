import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.jsx',
      refresh: !isProduction, 
    }),
    react(),
  ],
  server: !isProduction ? {
    hmr: {
      protocol: 'ws',
      host: 'localhost', // 開発用ホスト
    },
  } : undefined,
  base: '/', // 本番でも開発でも同じ
});
