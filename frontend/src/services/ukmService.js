import api from './api'

/**
 * UKM Service — berisi semua fungsi untuk komunikasi dengan UKM API
 */
const ukmService = {

  /**
   * Mengambil semua UKM (publik: hanya active)
   * GET /api/ukms
   */
  getAllUKMs: async () => {
    const response = await api.get('/api/ukms')
    return response.data
  },

  /**
   * Mengambil semua UKM untuk admin (termasuk pending/inactive)
   * GET /api/admin/ukms
   */
  getAllUKMsAdmin: async () => {
    const response = await api.get('/api/admin/ukms')
    return response.data
  },

  /**
   * Mengambil detail UKM berdasarkan ID
   * GET /api/ukms/:id
   */
  getUKMById: async (id) => {
    const response = await api.get(`/api/ukms/${id}`)
    return response.data
  },

  /**
   * Membuat UKM baru (admin only)
   * POST /api/ukms
   */
  createUKM: async (data) => {
    const response = await api.post('/api/ukms', data)
    return response.data
  },

  /**
   * Memperbarui data UKM (admin only)
   * PUT /api/ukms/:id
   */
  updateUKM: async (id, data) => {
    const response = await api.put(`/api/ukms/${id}`, data)
    return response.data
  },

  /**
   * Mengubah status UKM (admin only: pending/active/inactive)
   * PATCH /api/ukms/:id/status
   */
  updateUKMStatus: async (id, status) => {
    const response = await api.patch(`/api/ukms/${id}/status`, { status })
    return response.data
  },

  /**
   * Menghapus UKM (admin only)
   * DELETE /api/ukms/:id
   */
  deleteUKM: async (id) => {
    const response = await api.delete(`/api/ukms/${id}`)
    return response.data
  },

  /**
   * Mendaftarkan diri ke UKM (user yang login)
   * POST /api/ukms/:id/join
   */
  joinUKM: async (id) => {
    const response = await api.post(`/api/ukms/${id}/join`)
    return response.data
  },

  /**
   * Mengambil daftar anggota UKM
   * GET /api/ukms/:id/members
   */
  getUKMMembers: async (id) => {
    const response = await api.get(`/api/ukms/${id}/members`)
    return response.data
  },

  /**
   * Memperbarui role/status anggota UKM (admin atau pengurus)
   * PATCH /api/ukms/:id/members/:memberId
   */
  updateMember: async (ukmId, memberId, data) => {
    const response = await api.patch(`/api/ukms/${ukmId}/members/${memberId}`, data)
    return response.data
  },

  /**
   * Mengeluarkan anggota dari UKM (admin atau pengurus)
   * DELETE /api/ukms/:id/members/:memberId
   */
  deleteMember: async (ukmId, memberId) => {
    const response = await api.delete(`/api/ukms/${ukmId}/members/${memberId}`)
    return response.data
  },

  /**
   * Mengambil daftar UKM yang diikuti user yang login
   * GET /api/users/me/ukms
   */
  getMyUKMs: async () => {
    const response = await api.get('/api/users/me/ukms')
    return response.data
  },
}

export default ukmService