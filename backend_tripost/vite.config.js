import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.jsx',
      refresh: true,
    }),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
        // iOS 起動画面（自作ファイル名に合わせる）
        'icons/apple-splash-2048x2732.png',
        'icons/apple-splash-1668x2388.png',
        'icons/apple-splash-1536x2048.png',
        'icons/apple-splash-1170x2532.png',
        'icons/apple-splash-1125x2436.png',
        'icons/apple-splash-1242x2688.png'
      ],
      manifest: {
        name: 'Tripost',
        short_name: 'Tripost',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#F7D200',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png'},
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' }
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: { cacheName: 'assets', expiration: { maxEntries: 100 } }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'public/build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: 'resources/js/app.jsx',
    },
  },
});
