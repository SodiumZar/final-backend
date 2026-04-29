import api from './api'

/**
 * Announcement Service — berisi semua fungsi untuk komunikasi dengan Announcement API
 */
const announcementService = {

  /**
   * Mengambil semua pengumuman dari semua UKM (publik)
   * GET /api/announcements
   */
  getAllAnnouncements: async () => {
    const response = await api.get('/api/announcements')
    return response.data
  },

  /**
   * Mengambil semua pengumuman dari UKM tertentu (publik)
   * GET /api/ukms/:id/announcements
   */
  getAnnouncementsByUKM: async (ukmId) => {
    const response = await api.get(`/api/ukms/${ukmId}/announcements`)
    return response.data
  },

  /**
   * Mengambil detail pengumuman berdasarkan ID (publik)
   * GET /api/announcements/:id
   */
  getAnnouncementById: async (id) => {
    const response = await api.get(`/api/announcements/${id}`)
    return response.data
  },

  /**
   * Membuat pengumuman baru untuk UKM tertentu (admin atau pengurus UKM)
   * POST /api/ukms/:id/announcements
   */
  createAnnouncement: async (ukmId, data) => {
    const response = await api.post(`/api/ukms/${ukmId}/announcements`, data)
    return response.data
  },

  /**
   * Memperbarui isi pengumuman (admin atau pembuat pengumuman)
   * PUT /api/announcements/:id
   */
  updateAnnouncement: async (id, data) => {
    const response = await api.put(`/api/announcements/${id}`, data)
    return response.data
  },

  /**
   * Menghapus pengumuman (admin atau pembuat pengumuman)
   * DELETE /api/announcements/:id
   */
  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/api/announcements/${id}`)
    return response.data
  },
}

export default announcementService
