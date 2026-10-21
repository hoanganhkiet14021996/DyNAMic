import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Đường dẫn tương đối + HashRouter → chạy được ở mọi URL GitHub Pages, không cần khai báo tên repo.
export default defineConfig({
  base: './',
  // Cổng riêng: 5173 đang dùng cho project khác của bạn
  server: { port: 5190 },
  build: { chunkSizeWarningLimit: 700 },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon-v2.ico', 'apple-touch-icon-v2.png'],
      manifest: {
        name: 'DyNAMic',
        short_name: 'DyNAMic',
        description: 'To-do list và nhắc việc cá nhân',
        lang: 'vi',
        theme_color: '#fbf6e9',
        background_color: '#fbf6e9',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
