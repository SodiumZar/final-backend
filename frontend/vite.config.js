import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Konfigurasi Vite untuk project React
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Konfigurasi server development
  server: {
    port: 5173,
    // Proxy untuk menghindari CORS saat development lokal
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Konfigurasi build production
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Pisahkan vendor chunk agar caching lebih efisien
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          store: ['zustand'],
          ui: ['react-hot-toast', 'react-icons'],
        },
      },
    },
  },
  
  // Resolve alias untuk import yang lebih bersih
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})