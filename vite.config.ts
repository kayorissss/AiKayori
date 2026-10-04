import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  // @ts-ignore
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: false,
    headers: { 'X-Frame-Options': 'ALLOWALL' },
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    headers: { 'X-Frame-Options': 'ALLOWALL' }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
