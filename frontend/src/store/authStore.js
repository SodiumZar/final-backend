import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AUTH_STORAGE_KEY } from '../utils/constants'

/**
 * Auth Store menggunakan Zustand dengan persist middleware
 * State disimpan di localStorage sehingga tetap ada setelah refresh halaman
 *
 * State yang disimpan:
 * - user: data user yang sedang login (tanpa password)
 * - token: JWT token untuk request API
 * - isLoggedIn: boolean status login
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────
      user:       null,   // Data user yang sedang login
      token:      null,   // JWT token
      isLoggedIn: false,  // Status apakah user sudah login

      // ── Actions ──────────────────────────────────────────────

      /**
       * Menyimpan data user dan token setelah login/register berhasil
       * Dipanggil oleh authService setelah response API sukses
       */
      setAuth: (user, token) => {
        set({
          user,
          token,
          isLoggedIn: true,
        })
      },

      /**
       * Memperbarui data user (misalnya setelah update profil)
       * Token tidak berubah saat update profil
       */
      updateUser: (updatedUser) => {
        set((state) => ({
          user: { ...state.user, ...updatedUser },
        }))
      },

      /**
       * Menghapus semua data auth (logout)
       * Dipanggil saat user logout atau token expired (401)
       */
      clearAuth: () => {
        set({
          user:       null,
          token:      null,
          isLoggedIn: false,
        })
      },

      /**
       * Getter untuk mengambil token saat ini
       * Digunakan oleh Axios interceptor
       */
      getToken: () => {
        return get().token
      },

      /**
       * Getter untuk mengecek apakah user adalah admin
       */
      isAdmin: () => {
        return get().user?.role === 'admin'
      },

      /**
       * Getter untuk mengecek apakah user adalah pengurus UKM tertentu
       */
      isPengurus: (ukmId) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'admin') return true
        // Pengecekan pengurus spesifik dilakukan dengan data dari ukmStore
        return false
      },
    }),

    {
      // Konfigurasi persist middleware
      name: AUTH_STORAGE_KEY, // Key di localStorage: "auth-storage"

      // Hanya simpan field yang diperlukan (tidak perlu simpan semua actions)
      partialize: (state) => ({
        user:       state.user,
        token:      state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

export default useAuthStore