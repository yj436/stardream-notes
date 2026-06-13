import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

declare const process: {
  env: {
    BASE_PATH?: string
  }
}

const basePath = process.env.BASE_PATH?.trim() || '/'

export default defineConfig({
  base: basePath,
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
