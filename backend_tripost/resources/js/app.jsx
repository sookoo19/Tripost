import '../css/app.css';
import './bootstrap';

import { registerSW } from 'virtual:pwa-register';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Inertia } from '@inertiajs/inertia';

// service worker 登録（vite-plugin-pwa 使用時）
const updateSW = registerSW({
  onRegistered(registration) {
    console.log('Service Worker registered:', registration);
  },
  onNeedRefresh() {
    // 新バージョン利用可能時のハンドリング（UIで通知する等）
    console.log('新しいバージョンがあります。更新してください。');
  },
  onOfflineReady() {
    console.log('アプリがオフラインで利用可能になりました。');
  },
});

const appName = import.meta.env.VITE_APP_NAME || 'Tripost';

createInertiaApp({
  title: title => `${title} - ${appName}`,
  resolve: name =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob('./Pages/**/*.jsx')
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);

    // Inertia ナビゲーション時に page_view を送信
    Inertia.on('navigate', () => {
      try {
        if (typeof window !== 'undefined' && window.gtag && window.GA_ID) {
          window.gtag('config', window.GA_ID, {
            page_path: window.location.pathname + window.location.search,
          });
        }
      } catch (e) {
        // noop
      }
    });
  },
  progress: {
    color: '#4B5563',
  },
});
