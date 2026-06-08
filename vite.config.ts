import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['manifest.json', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /\/db\/.*\.SQLite3$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bible-db',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/dict\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kuromoji-dict',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 90 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/jtrb-platform/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
