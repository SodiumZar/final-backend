import api from './api'

/**
 * Event Service — berisi semua fungsi untuk komunikasi dengan Event API
 */
const eventService = {

  /**
   * Mengambil semua event dari semua UKM (publik)
   * GET /api/events
   */
  getAllEvents: async () => {
    const response = await api.get('/api/events')
    return response.data
  },

  /**
   * Mengambil semua event dari UKM tertentu (publik)
   * GET /api/ukms/:id/events
   */
  getEventsByUKM: async (ukmId) => {
    const response = await api.get(`/api/ukms/${ukmId}/events`)
    return response.data
  },

  /**
   * Mengambil detail event beserta sisa quota (publik)
   * GET /api/events/:id
   */
  getEventById: async (id) => {
    const response = await api.get(`/api/events/${id}`)
    return response.data
  },

  /**
   * Membuat event baru untuk UKM tertentu (admin atau pengurus UKM)
   * POST /api/ukms/:id/events
   */
  createEvent: async (ukmId, data) => {
    const response = await api.post(`/api/ukms/${ukmId}/events`, data)
    return response.data
  },

  /**
   * Memperbarui data event (admin atau pengurus UKM)
   * PUT /api/events/:id
   */
  updateEvent: async (id, data) => {
    const response = await api.put(`/api/events/${id}`, data)
    return response.data
  },

  /**
   * Menghapus event (admin atau pengurus UKM)
   * DELETE /api/events/:id
   */
  deleteEvent: async (id) => {
    const response = await api.delete(`/api/events/${id}`)
    return response.data
  },

  /**
   * Mendaftarkan diri ke event (user yang login)
   * POST /api/events/:id/register
   */
  registerToEvent: async (id) => {
    const response = await api.post(`/api/events/${id}/register`)
    return response.data
  },

  /**
   * Mengambil daftar pendaftar event (admin atau pengurus UKM)
   * GET /api/events/:id/registrants
   */
  getEventRegistrants: async (id) => {
    const response = await api.get(`/api/events/${id}/registrants`)
    return response.data
  },

  /**
   * Mengubah status pendaftar event (approve/reject)
   * PATCH /api/events/:id/registrants/:registrantId
   */
  updateRegistrantStatus: async (eventId, registrantId, status) => {
    const response = await api.patch(
      `/api/events/${eventId}/registrants/${registrantId}`,
      { status }
    )
    return response.data
  },

  /**
   * Mengambil daftar event yang didaftarkan oleh user yang login
   * GET /api/users/me/events
   */
  getMyEvents: async () => {
    const response = await api.get('/api/users/me/events')
    return response.data
  },
}

export default eventService
