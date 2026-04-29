import api from './api'
import useAuthStore from '../store/authStore'

/**
 * Auth Service — berisi semua fungsi untuk komunikasi dengan Auth API
 * Setiap fungsi memanggil endpoint backend dan mengupdate Zustand store
 */
const authService = {

  /**
   * Mendaftarkan user baru
   * POST /api/auth/register
   */
  register: async (data) => {
    const response = await api.post('/api/auth/register', data)
    const { token, user } = response.data.data

    // Simpan token dan data user ke store setelah register berhasil
    useAuthStore.getState().setAuth(user, token)

    return response.data
  },

  /**
   * Login dengan email dan password
   * POST /api/auth/login
   */
  login: async (data) => {
    const response = await api.post('/api/auth/login', data)
    const { token, user } = response.data.data

    // Simpan token dan data user ke store setelah login berhasil
    useAuthStore.getState().setAuth(user, token)

    return response.data
  },

  /**
   * Mengambil data profil user yang sedang login
   * GET /api/auth/me
   */
  getMe: async () => {
    const response = await api.get('/api/auth/me')
    const user = response.data.data

    // Update data user di store dengan data terbaru dari server
    useAuthStore.getState().updateUser(user)

    return response.data
  },

  /**
   * Logout user
   * POST /api/auth/logout
   * Menghapus semua data auth dari store dan localStorage
   */
  logout: async () => {
    try {
      // Beritahu server (opsional — JWT stateless, tapi tetap kirim request)
      await api.post('/api/auth/logout')
    } catch {
      // Abaikan error — tetap lanjutkan proses logout di client
    } finally {
      // Hapus semua data auth dari Zustand store (dan localStorage via persist)
      useAuthStore.getState().clearAuth()
    }
  },
}

export default authService
