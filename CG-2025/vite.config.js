import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': '/CG1'
    }
  }
})
