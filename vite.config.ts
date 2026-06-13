import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base must match the GitHub Pages sub-path: https://<user>.github.io/genshindle-helper/
export default defineConfig({
  base: '/genshindle-helper/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
