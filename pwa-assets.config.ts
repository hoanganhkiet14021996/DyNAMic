import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Chạy `npx pwa-assets-generator` sau khi sửa public/logo.svg để sinh lại icon.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    apple: { sizes: [180], padding: 0, resizeOptions: { background: '#4a2c0a' } },
    maskable: { sizes: [512], padding: 0, resizeOptions: { background: '#4a2c0a' } },
  },
  images: ['public/logo.svg'],
})
