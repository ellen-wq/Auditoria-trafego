import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000'
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    hmr: {
      clientPort: 5174 // Usar mesma porta do servidor para evitar conflitos
    }
  },
  build: {
    outDir: '../public_dist',
    emptyOutDir: true
  }
})
