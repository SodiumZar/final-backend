import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiUsers,
  FiClock, FiCheck, FiX, FiEdit2, FiTrash2,
  FiUserPlus,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import eventService from '../../services/eventService'
import useAuthStore from '../../store/authStore'
import useUKMStore from '../../store/ukmStore'
import Button from '../../components/Button'
import Modal, { ConfirmModal } from '../../components/Modal'
import { InlineLoader, EmptyState } from '../../components/Loading'
import {
  getStatusColor, getStatusLabel,
  formatDateTime, calculateQuotaPercentage,
  getQuotaBarColor,
} from '../../utils/helpers'
import { useForm } from 'react-hook-form'

/**
 * Halaman Detail Event — menampilkan informasi lengkap satu event
 * Fitur: daftar ke event, lihat & kelola pendaftar (admin/pengurus)
 */
const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { isPengurusOf } = useUKMStore()

  const isAdmin = user?.role === 'admin'

  // ── State ──────────────────────────────────────────────────
  const [event, setEvent]               = useState(null)
  const [registrants, setRegistrants]   = useState([])
  const [myRegistration, setMyRegistration] = useState(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showRegistrants, setShowRegistrants] = useState(false)
  const [isLoadingReg, setIsLoadingReg] = useState(false)

  // Modal states
  const [showEditModal, setShowEditModal]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSubmitting, setIsSubmitting]       = useState(false)

  // Edit form
  const editForm = useForm()

  // ── Fetch detail event ─────────────────────────────────────
  const fetchEvent = async () => {
    setIsLoading(true)
    try {
      const res = await eventService.getEventById(id)
      const eventData = res.data
      setEvent(eventData)

      // Set nilai default form edit
      editForm.reset({
        title:       eventData.title,
        description: eventData.description,
        location:    eventData.location,
        quota:       eventData.quota,
        status:      eventData.status,
      })
    } catch {
      toast.error('Gagal memuat detail event')
      navigate('/events')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Fetch daftar pendaftar (jika admin/pengurus) ───────────
  const fetchRegistrants = async () => {
    setIsLoadingReg(true)
    try {
      const res = await eventService.getEventRegistrants(id)
      const regs = res.data || []
      setRegistrants(regs)

      // Cari registrasi milik user yang login
      if (user) {
        const mine = regs.find((r) => r.user_id === user.id || r.user?.id === user.id)
        setMyRegistration(mine || null)
      }
    } catch {
      // Abaikan error jika user tidak punya akses lihat registrant
    } finally {
      setIsLoadingReg(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  useEffect(() => {
    // Fetch registrant setelah event ter-load
    if (event && isLoggedIn) {
      fetchRegistrants()
    }
  }, [event, isLoggedIn])

  // ── Tentukan apakah user adalah pengurus event ini ─────────
  const isPengurus = event
    ? isAdmin || isPengurusOf(event.ukm_id || event.ukm?.id)
    : false

  // ── Handler Daftar ke Event ────────────────────────────────
  const handleRegister = async () => {
    if (!isLoggedIn) {
      toast.error('Silakan login terlebih dahulu')
      navigate('/login')
      return
    }
    setIsRegistering(true)
    try {
      await eventService.registerToEvent(id)
      toast.success('Berhasil mendaftar ke event! Menunggu persetujuan panitia.')
      // Refresh registrant list
      await fetchRegistrants()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal mendaftar ke event')
    } finally {
      setIsRegistering(false)
    }
  }

  // ── Handler Update Status Pendaftar ───────────────────────
  const handleUpdateRegistrant = async (registrantId, status) => {
    try {
      await eventService.updateRegistrantStatus(id, registrantId, status)
      toast.success(`Status pendaftar berhasil diubah menjadi ${getStatusLabel(status)}`)
      await fetchRegistrants()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui status')
    }
  }

  // ── Handler Edit Event ─────────────────────────────────────
  const handleEditEvent = async (data) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        quota: parseInt(data.quota),
      }
      // Hanya kirim tanggal jika diisi
      if (data.start_date) payload.start_date = new Date(data.start_date).toISOString()
      if (data.end_date)   payload.end_date   = new Date(data.end_date).toISOString()

      const res = await eventService.updateEvent(id, payload)
      setEvent(res.data)
      toast.success('Event berhasil diperbarui')
      setShowEditModal(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui event')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Handler Hapus Event ────────────────────────────────────
  const handleDeleteEvent = async () => {
    setIsSubmitting(true)
    try {
      await eventService.deleteEvent(id)
      toast.success('Event berhasil dihapus')
      navigate('/events')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus event')
      setShowDeleteModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) return null

  // ── Hitung data quota ──────────────────────────────────────
  const approvedCount  = event.approved_count || 0
  const quotaPercent   = calculateQuotaPercentage(approvedCount, event.quota)
  const quotaBarColor  = getQuotaBarColor(quotaPercent)
  const remainingQuota = event.remaining_quota ?? (event.quota - approvedCount)
  const isQuotaFull    = remainingQuota <= 0
  const canRegister    = isLoggedIn
    && !isAdmin
    && !myRegistration
    && event.status === 'upcoming'
    && !isQuotaFull

  // ── Label status untuk tombol registrasi ──────────────────
  const getRegistrationStatusLabel = () => {
    if (!isLoggedIn)                    return null
    if (!myRegistration)                return null
    const labels = {
      pending:  { text: 'Menunggu Persetujuan', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      approved: { text: 'Terdaftar ✓',          color: 'bg-green-50  text-green-700  border-green-200'  },
      rejected: { text: 'Ditolak',              color: 'bg-red-50    text-red-700    border-red-200'    },
    }
    return labels[myRegistration.status] || null
  }

  const regStatus = getRegistrationStatusLabel()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Back Button ──────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Kolom Kiri: Detail Event ──────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Card Info Utama */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Header: Status + Nama UKM */}
            <div className="flex items-center justify-between mb-3">
              <span className={`
                text-xs font-semibold px-2.5 py-1 rounded-full border
                ${getStatusColor(event.status)}
              `}>
                {getStatusLabel(event.status)}
              </span>
              {event.ukm?.name && (
                <span className="text-xs text-gray-400 font-medium">
                  {event.ukm.name}
                </span>
              )}
            </div>

            {/* Judul event */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 leading-tight">
              {event.title}
            </h1>

            {/* Info lokasi, tanggal, quota */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{event.location || 'Lokasi belum ditentukan'}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{formatDateTime(event.start_date)}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    s/d {formatDateTime(event.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <FiUsers className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>
                  {approvedCount} / {event.quota} peserta terdaftar
                  {isQuotaFull
                    ? <span className="ml-1.5 text-red-500 font-medium">(Penuh)</span>
                    : <span className="ml-1.5 text-green-600 font-medium">({remainingQuota} sisa)</span>
                  }
                </span>
              </div>
            </div>

            {/* Progress bar quota */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Kapasitas</span>
                <span>{quotaPercent}% terisi</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${quotaBarColor}`}
                  style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Deskripsi event */}
            <div className="border-t border-gray-100 pt-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Tentang Event</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Tombol aksi admin/pengurus */}
            {isPengurus && (
              <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEditModal(true)}
                  leftIcon={<FiEdit2 className="w-3.5 h-3.5" />}
                >
                  Edit Event
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  leftIcon={<FiTrash2 className="w-3.5 h-3.5" />}
                >
                  Hapus
                </Button>
              </div>
            )}
          </div>

          {/* ── Panel Pendaftar (Admin/Pengurus) ─────────── */}
          {isPengurus && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowRegistrants(!showRegistrants)}
              >
                <div className="flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    Daftar Pendaftar
                  </h2>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    {registrants.length}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {showRegistrants ? '▲' : '▼'}
                </span>
              </div>

              {showRegistrants && (
                <div className="border-t border-gray-100">
                  {isLoadingReg ? (
                    <InlineLoader message="Memuat data pendaftar..." />
                  ) : registrants.length === 0 ? (
                    <EmptyState
                      icon="👤"
                      title="Belum Ada Pendaftar"
                      message="Belum ada yang mendaftar ke event ini."
                    />
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {registrants.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Info pendaftar */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {reg.user?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {reg.user?.name || 'User'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {reg.user?.nim} · {reg.user?.email}
                              </p>
                            </div>
                          </div>

                          {/* Status & Tombol aksi */}
                          <div className="flex items-center gap-2">
                            <span className={`
                              text-xs font-medium px-2 py-0.5 rounded-full border
                              ${getStatusColor(reg.status)}
                            `}>
                              {getStatusLabel(reg.status)}
                            </span>

                            {/* Tombol approve/reject untuk status pending */}
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateRegistrant(reg.id, 'approved')}
                                  disabled={isQuotaFull}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={isQuotaFull ? 'Quota penuh' : 'Setujui pendaftar'}
                                >
                                  <FiCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateRegistrant(reg.id, 'rejected')}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                  title="Tolak pendaftar"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Tombol reject untuk status approved */}
                            {reg.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateRegistrant(reg.id, 'rejected')}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Batalkan persetujuan"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol approve kembali untuk status rejected */}
                            {reg.status === 'rejected' && !isQuotaFull && (
                              <button
                                onClick={() => handleUpdateRegistrant(reg.id, 'approved')}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Setujui kembali"
                              >
                                <FiCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Kolom Kanan: Panel Registrasi ────────────── */}
        <div className="space-y-4">

          {/* Card Registrasi */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUserPlus className="w-4 h-4 text-blue-500" />
              Pendaftaran Event
            </h2>

            {/* Status kuota */}
            <div className={`
              p-3 rounded-xl text-center mb-4 text-sm font-medium
              ${isQuotaFull
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-green-50 text-green-600 border border-green-100'
              }
            `}>
              {isQuotaFull
                ? '❌ Kuota Event Penuh'
                : `✅ ${remainingQuota} Kuota Tersisa`
              }
            </div>

            {/* Tombol daftar / status registrasi */}
            {!isLoggedIn ? (
              // User belum login
              <div className="space-y-2">
                <Button
                  fullWidth
                  onClick={() => navigate('/login')}
                >
                  Login untuk Mendaftar
                </Button>
                <p className="text-xs text-center text-gray-400">
                  Belum punya akun?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-blue-600 hover:underline"
                  >
                    Daftar
                  </button>
                </p>
              </div>
            ) : isAdmin ? (
              // Admin tidak mendaftar event
              <p className="text-xs text-center text-gray-400 py-2">
                Admin tidak bisa mendaftar sebagai peserta event.
              </p>
            ) : myRegistration ? (
              // User sudah mendaftar — tampilkan status
              <div className={`
                flex items-center justify-center gap-2 px-4 py-3
                rounded-xl border text-sm font-medium
                ${regStatus?.color || 'bg-gray-50 text-gray-600 border-gray-200'}
              `}>
                {regStatus?.text || getStatusLabel(myRegistration.status)}
              </div>
            ) : event.status !== 'upcoming' ? (
              // Event bukan upcoming
              <p className="text-xs text-center text-gray-400 py-2">
                Pendaftaran tidak tersedia untuk event berstatus{' '}
                <span className="font-medium">{getStatusLabel(event.status)}</span>.
              </p>
            ) : (
              // Bisa mendaftar
              <Button
                fullWidth
                onClick={handleRegister}
                isLoading={isRegistering}
                disabled={isQuotaFull}
                leftIcon={<FiUserPlus className="w-4 h-4" />}
              >
                {isQuotaFull ? 'Kuota Penuh' : 'Daftar ke Event Ini'}
              </Button>
            )}

            {/* Info tambahan */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Mulai
                </span>
                <span className="font-medium text-gray-700">
                  {event.start_date
                    ? new Date(event.start_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiClock className="w-3.5 h-3.5" />
                  Selesai
                </span>
                <span className="font-medium text-gray-700">
                  {event.end_date
                    ? new Date(event.end_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiUsers className="w-3.5 h-3.5" />
                  Kapasitas
                </span>
                <span className="font-medium text-gray-700">
                  {approvedCount} / {event.quota}
                </span>
              </div>
            </div>
          </div>

          {/* Card UKM Penyelenggara */}
          {event.ukm && (
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/ukms/${event.ukm.id}`)}
            >
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Penyelenggara
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                  {event.ukm.logo_url
                    ? <img src={event.ukm.logo_url} alt={event.ukm.name} className="w-full h-full object-cover" />
                    : event.ukm.name?.charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{event.ukm.name}</p>
                  <p className="text-xs text-gray-400">{event.ukm.category}</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3 font-medium">Lihat profil UKM →</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Edit Event ──────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Event"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEditEvent)} className="space-y-4">

          {/* Judul */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Judul Event <span className="text-red-500">*</span>
            </label>
            <input
              {...editForm.register('title', { required: 'Judul wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
            {editForm.formState.errors.title && (
              <p className="mt-1 text-xs text-red-500">⚠ {editForm.formState.errors.title.message}</p>
            )}
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              {...editForm.register('location', { required: 'Lokasi wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai</label>
              <input
                type="datetime-local"
                {...editForm.register('start_date')}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Selesai</label>
              <input
                type="datetime-local"
                {...editForm.register('end_date')}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Quota & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Quota <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                {...editForm.register('quota', {
                  required: 'Quota wajib diisi',
                  min: { value: 1, message: 'Minimal 1' },
                })}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                {...editForm.register('status')}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all appearance-none"
              >
                <option value="upcoming">Akan Datang</option>
                <option value="ongoing">Berlangsung</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              {...editForm.register('description', { required: 'Deskripsi wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowEditModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Konfirmasi Hapus ────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        title="Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${event?.title}"? Event tidak bisa dihapus jika sudah ada peserta yang disetujui.`}
        confirmLabel="Ya, Hapus Event"
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default EventDetail
