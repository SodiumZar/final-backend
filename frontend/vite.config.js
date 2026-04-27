import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],

  server: {
    // Port yang digunakan saat development
    port: 5173,

    // Konfigurasi proxy untuk menghindari masalah CORS saat development
    // Setiap request ke /api akan diteruskan ke backend Go
    proxy: {
      '/api': {
        // Alamat backend Go
        target: 'http://localhost:8080',

        // Ubah origin header agar sesuai dengan target
        changeOrigin: true,

        // Contoh: /api/auth/login → http://localhost:8080/api/auth/login
        // (tidak perlu rewrite karena path sudah sama)
      }
    }
  },

  build: {
    // Folder output hasil build
    outDir: 'dist',

    // Hapus folder dist sebelum build baru
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      '@': '/src',
    }
  }
  
})
