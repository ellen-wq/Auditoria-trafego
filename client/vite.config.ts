import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../public_dist',
    emptyOutDir: true,
    // Evita tela branca pós-deploy por HTML antigo apontando para hash antigo.
    // Mantemos nomes estáveis para JS/CSS entre versões.
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk.js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo?.name || ''
          if (name.endsWith('.css')) return 'assets/app.css'
          if (name.endsWith('.svg')) return 'assets/[name][extname]'
          return 'assets/[name][extname]'
        }
      }
    }
  }
})
