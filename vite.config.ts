import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      // Use our own manifest.json (created by T3)
      manifest: false,
      // Include manifest in the precache manually
      includeAssets: ['manifest.json', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Runtime caching for large DB files
        runtimeCaching: [
          {
            urlPattern: /\/db\/.*\.SQLite3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-db',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
          {
            urlPattern: /\/dict\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kuromoji-dict',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
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
