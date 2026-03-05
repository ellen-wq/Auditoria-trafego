import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
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
    // Na Vercel: pasta "public" é servida como estático (evita ESM→CJS e "exports is not defined")
    outDir: '../public',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
})
