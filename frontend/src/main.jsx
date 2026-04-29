import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

/**
 * Entry point aplikasi React
 * Membungkus App dengan:
 * - StrictMode: mendeteksi masalah potensial saat development
 * - BrowserRouter: mengaktifkan React Router untuk navigasi SPA
 * - Toaster: provider notifikasi global dari react-hot-toast
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Provider notifikasi toast global */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 72, // Posisi di bawah Navbar (tinggi navbar ~64px)
        }}
        toastOptions={{
          // Durasi default semua toast
          duration: 4000,

          // Style dasar untuk semua toast
          style: {
            background: '#fff',
            color:       '#1f2937',
            fontSize:    '14px',
            fontWeight:  '500',
            borderRadius: '12px',
            boxShadow:   '0 4px 24px rgba(0,0,0,0.08)',
            border:      '1px solid #f3f4f6',
            padding:     '12px 16px',
            maxWidth:    '380px',
          },

          // Style untuk toast sukses (hijau)
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #22c55e',
            },
          },

          // Style untuk toast error (merah)
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #ef4444',
            },
          },

          // Style untuk toast loading
          loading: {
            style: {
              borderLeft: '4px solid #3b82f6',
            },
          },
        }}
      />

      {/* Komponen utama aplikasi */}
      <App />
    </BrowserRouter>
  </StrictMode>
)