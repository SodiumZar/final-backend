import { create } from 'zustand'

/**
 * UKM Store untuk menyimpan state terkait UKM
 * Store ini TIDAK dipersist karena data UKM selalu di-fetch ulang dari API
 *
 * State:
 * - ukms: daftar semua UKM
 * - selectedUKM: detail UKM yang sedang dilihat
 * - myUKMs: UKM yang diikuti oleh user yang sedang login
 * - isLoading: status loading untuk operasi async
 */
const useUKMStore = create((set, get) => ({
  // ── Initial State ──────────────────────────────────────────
  ukms:        [],     // Daftar semua UKM
  selectedUKM: null,   // UKM yang sedang dipilih/dilihat
  myUKMs:      [],     // UKM yang diikuti user yang login
  isLoading:   false,  // Status loading global untuk UKM
  error:        null,  // Pesan error terakhir

  // ── UKM List Actions ───────────────────────────────────────

  /**
   * Menyimpan daftar UKM ke store
   */
  setUKMs: (ukms) => {
    set({ ukms, error: null })
  },

  /**
   * Menyimpan detail UKM yang sedang dilihat
   */
  setSelectedUKM: (ukm) => {
    set({ selectedUKM: ukm })
  },

  /**
   * Menghapus data UKM yang dipilih (saat keluar dari halaman detail)
   */
  clearSelectedUKM: () => {
    set({ selectedUKM: null })
  },

  /**
   * Menyimpan daftar UKM yang diikuti user yang login
   */
  setMyUKMs: (myUKMs) => {
    set({ myUKMs })
  },

  /**
   * Menambahkan UKM baru ke daftar (setelah create berhasil)
   */
  addUKM: (ukm) => {
    set((state) => ({
      ukms: [ukm, ...state.ukms],
    }))
  },

  /**
   * Memperbarui data UKM di daftar (setelah update berhasil)
   */
  updateUKM: (updatedUKM) => {
    set((state) => ({
      ukms: state.ukms.map((ukm) =>
        ukm.id === updatedUKM.id ? updatedUKM : ukm
      ),
      // Jika UKM yang diupdate adalah yang sedang dipilih, update juga
      selectedUKM: state.selectedUKM?.id === updatedUKM.id
        ? updatedUKM
        : state.selectedUKM,
    }))
  },

  /**
   * Menghapus UKM dari daftar (setelah delete berhasil)
   */
  removeUKM: (ukmId) => {
    set((state) => ({
      ukms: state.ukms.filter((ukm) => ukm.id !== ukmId),
    }))
  },

  // ── Loading & Error State ──────────────────────────────────

  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)     => set({ error }),
  clearError: ()          => set({ error: null }),

  // ── Helper Getters ─────────────────────────────────────────

  /**
   * Mengecek apakah user sudah menjadi anggota UKM tertentu
   */
  isMemberOf: (ukmId) => {
    const { myUKMs } = get()
    return myUKMs.some(
      (m) => (m.ukm_id === ukmId || m.ukm?.id === ukmId)
    )
  },

  /**
   * Mengambil detail keanggotaan user di UKM tertentu
   */
  getMembership: (ukmId) => {
    const { myUKMs } = get()
    return myUKMs.find(
      (m) => (m.ukm_id === ukmId || m.ukm?.id === ukmId)
    ) || null
  },

  /**
   * Mengecek apakah user adalah pengurus/ketua UKM tertentu
   */
  isPengurusOf: (ukmId) => {
    const { myUKMs } = get()
    const membership = myUKMs.find(
      (m) => (m.ukm_id === ukmId || m.ukm?.id === ukmId)
    )
    if (!membership) return false
    return (
      membership.status === 'active' &&
      (membership.role === 'ketua' || membership.role === 'pengurus')
    )
  },

  /**
   * Reset semua state UKM (saat logout)
   */
  reset: () => {
    set({
      ukms:        [],
      selectedUKM: null,
      myUKMs:      [],
      isLoading:   false,
      error:        null,
    })
  },
}))

export default useUKMStore