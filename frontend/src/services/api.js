import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../utils/constants'

/**
 * Instance Axios utama dengan konfigurasi base URL dan timeout
 * Semua request API menggunakan instance ini
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Timeout 15 detik
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Dijalankan sebelum setiap request dikirim ke server
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (format Zustand persist)
    // Key: "auth-storage" → parse JSON → ambil state.token
    try {
      const authStorageRaw = localStorage.getItem('auth-storage')
      if (authStorageRaw) {
        const authStorage = JSON.parse(authStorageRaw)
        const token = authStorage?.state?.token

        // Jika token ada, tambahkan ke header Authorization
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch {
      // Abaikan error parsing localStorage
    }

    return config
  },
  (error) => {
    // Error saat mempersiapkan request
    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Dijalankan setelah setiap response diterima dari server
// ─────────────────────────────────────────────────────────────
api.interceptors.response.use(
  // Response sukses (status 2xx) — langsung kembalikan
  (response) => response,

  // Response error (status bukan 2xx)
  (error) => {
    const status = error?.response?.status

    // ── 401 Unauthorized ──────────────────────────────────────
    // Token expired atau tidak valid → paksa logout
    if (status === 401) {
      // Hapus data auth dari localStorage
      localStorage.removeItem('auth-storage')

      // Tampilkan notifikasi ke user
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.')

      // Redirect ke halaman login
      // Menggunakan window.location agar state React direset sepenuhnya
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // ── 403 Forbidden ─────────────────────────────────────────
    // User tidak punya izin untuk aksi ini
    if (status === 403) {
      toast.error('Anda tidak memiliki izin untuk melakukan aksi ini.')
    }

    // ── 500 Internal Server Error ─────────────────────────────
    // Error di sisi server
    if (status === 500) {
      toast.error('Terjadi kesalahan pada server. Coba lagi nanti.')
    }

    // ── Network Error ─────────────────────────────────────────
    // Tidak bisa connect ke server (server mati atau no internet)
    if (!error.response) {
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
    }

    return Promise.reject(error)
  }
)

export default api