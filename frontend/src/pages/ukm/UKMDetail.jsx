import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiUsers, FiCalendar, FiBell,
  FiEdit2, FiTrash2, FiCheck, FiX, FiUserPlus,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import ukmService from '../../services/ukmService'
import eventService from '../../services/eventService'
import announcementService from '../../services/announcementService'
import useAuthStore from '../../store/authStore'
import useUKMStore from '../../store/ukmStore'
import Button from '../../components/Button'
import Modal, { ConfirmModal } from '../../components/Modal'
import { EventCard, AnnouncementCard } from '../../components/Card'
import { InlineLoader, EmptyState, SkeletonCard } from '../../components/Loading'
import {
  getStatusColor, getStatusLabel,
  formatDate, formatDateTime, formatDateTimeLocal,
} from '../../utils/helpers'
import { useForm } from 'react-hook-form'

/**
 * Halaman Detail UKM — menampilkan info lengkap, anggota, event, dan pengumuman UKM
 */
const UKMDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { myUKMs, setMyUKMs, isMemberOf, isPengurusOf } = useUKMStore()

  const isAdmin    = user?.role === 'admin'
  const isPengurus = isAdmin || isPengurusOf(id)

  // ── State ──────────────────────────────────────────────────
  const [ukm, setUkm]           = useState(null)
  const [members, setMembers]   = useState([])
  const [events, setEvents]     = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info') // info | members | events | announcements
  const [isJoining, setIsJoining] = useState(false)
  const alreadyMember = isMemberOf(id)

  // Modal states
  const [showEditModal, setShowEditModal]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showEventModal, setShowEventModal]   = useState(false)
  const [showAnnModal, setShowAnnModal]       = useState(false)
  const [isSubmitting, setIsSubmitting]       = useState(false)

  // Forms
  const editForm  = useForm()
  const eventForm = useForm()
  const annForm   = useForm()

  // ── Fetch semua data UKM ───────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        // Fetch paralel untuk performa lebih baik
        const [ukmRes, eventRes, annRes] = await Promise.all([
          ukmService.getUKMById(id),
          eventService.getEventsByUKM(id),
          announcementService.getAnnouncementsByUKM(id),
        ])
        setUkm(ukmRes.data)
        setEvents(eventRes.data || [])
        setAnnouncements(annRes.data || [])

        // Isi nilai default form edit
        if (ukmRes.data) {
          editForm.reset({
            name:         ukmRes.data.name,
            description:  ukmRes.data.description,
            category:     ukmRes.data.category,
            logo_url:     ukmRes.data.logo_url,
            founded_year: ukmRes.data.founded_year,
          })
        }

        // Fetch anggota jika user sudah login
        if (isLoggedIn) {
          const memberRes = await ukmService.getUKMMembers(id)
          setMembers(memberRes.data || [])
        }

        // Fetch UKM yang diikuti user (untuk cek status member)
        if (isLoggedIn) {
          const myUKMRes = await ukmService.getMyUKMs()
          setMyUKMs(myUKMRes.data || [])
        }
      } catch {
        toast.error('Gagal memuat detail UKM')
        navigate('/ukms')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [id, isLoggedIn])

  // ── Handler Join UKM ──────────────────────────────────────
  const handleJoin = async () => {
    if (!isLoggedIn) {
      toast.error('Silakan login terlebih dahulu')
      navigate('/login')
      return
    }
    setIsJoining(true)
    try {
      await ukmService.joinUKM(id)
      toast.success('Berhasil mendaftar ke UKM! Menunggu persetujuan pengurus.')
      // Refresh data keanggotaan
      const myUKMRes = await ukmService.getMyUKMs()
      setMyUKMs(myUKMRes.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal mendaftar ke UKM')
    } finally {
      setIsJoining(false)
    }
  }

  // ── Handler Edit UKM ──────────────────────────────────────
  const handleEditUKM = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await ukmService.updateUKM(id, {
        ...data,
        founded_year: parseInt(data.founded_year),
      })
      setUkm(res.data)
      toast.success('Data UKM berhasil diperbarui')
      setShowEditModal(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui UKM')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Handler Hapus UKM ─────────────────────────────────────
  const handleDeleteUKM = async () => {
    setIsSubmitting(true)
    try {
      await ukmService.deleteUKM(id)
      toast.success('UKM berhasil dihapus')
      navigate('/ukms')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus UKM')
      setShowDeleteModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Handler Update Status UKM ─────────────────────────────
  const handleUpdateStatus = async (status) => {
    try {
      const res = await ukmService.updateUKMStatus(id, status)
      setUkm(res.data)
      toast.success(`Status UKM diubah menjadi: ${getStatusLabel(status)}`)
      setShowStatusModal(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal mengubah status')
    }
  }

  // ── Handler Buat Event ────────────────────────────────────
  const handleCreateEvent = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await eventService.createEvent(id, {
        ...data,
        quota: parseInt(data.quota),
        start_date: new Date(data.start_date).toISOString(),
        end_date:   new Date(data.end_date).toISOString(),
      })
      setEvents((prev) => [res.data, ...prev])
      toast.success('Event berhasil dibuat!')
      setShowEventModal(false)
      eventForm.reset()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal membuat event')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Handler Buat Pengumuman ───────────────────────────────
  const handleCreateAnn = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await announcementService.createAnnouncement(id, data)
      setAnnouncements((prev) => [res.data, ...prev])
      toast.success('Pengumuman berhasil dibuat!')
      setShowAnnModal(false)
      annForm.reset()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal membuat pengumuman')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Handler Update Status Member ──────────────────────────
  const handleUpdateMember = async (memberId, data) => {
    try {
      const res = await ukmService.updateMember(id, memberId, data)
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...res.data } : m))
      )
      toast.success('Status anggota berhasil diperbarui')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui anggota')
    }
  }

  // ── Handler Hapus Member ──────────────────────────────────
  const handleDeleteMember = async (memberId) => {
    try {
      await ukmService.deleteMember(id, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success('Anggota berhasil dikeluarkan dari UKM')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus anggota')
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white rounded-2xl p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!ukm) return null

  // ── Tabs ──────────────────────────────────────────────────
  const tabs = [
    { id: 'info',          label: 'Info',         count: null },
    { id: 'events',        label: 'Event',        count: events.length },
    { id: 'announcements', label: 'Pengumuman',   count: announcements.length },
    ...(isLoggedIn ? [{ id: 'members', label: 'Anggota', count: members.length }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Back Button ──────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Kembali ke Daftar UKM
      </button>

      {/* ── Header Card UKM ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Logo UKM */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
            {ukm.logo_url
              ? <img src={ukm.logo_url} alt={ukm.name} className="w-full h-full object-cover" />
              : ukm.name?.charAt(0).toUpperCase()
            }
          </div>

          {/* Info utama */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{ukm.name}</h1>
              {/* Badge status */}
              <span className={`
                text-xs font-medium px-2.5 py-1 rounded-full border
                ${getStatusColor(ukm.status)}
              `}>
                {getStatusLabel(ukm.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
              <span>🏷️ {ukm.category}</span>
              <span>📅 Berdiri {ukm.founded_year}</span>
              <span>👥 {members.filter(m => m.status === 'active').length} anggota aktif</span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">{ukm.description}</p>
          </div>

          {/* Tombol aksi */}
          <div className="flex flex-wrap gap-2 sm:flex-col">
            {/* Tombol Join (mahasiswa yang belum join) */}
            {isLoggedIn && !isAdmin && !alreadyMember && ukm.status === 'active' && (
              <Button
                size="sm"
                onClick={handleJoin}
                isLoading={isJoining}
                leftIcon={<FiUserPlus className="w-3.5 h-3.5" />}
              >
                Bergabung
              </Button>
            )}

            {/* Badge sudah bergabung */}
            {alreadyMember && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-100">
                <FiCheck className="w-3.5 h-3.5" />
                Sudah Bergabung
              </span>
            )}

            {/* Tombol Edit & Delete (admin) */}
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEditModal(true)}
                  leftIcon={<FiEdit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatusModal(true)}
                >
                  Ubah Status
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  leftIcon={<FiTrash2 className="w-3.5 h-3.5" />}
                >
                  Hapus
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              whitespace-nowrap transition-all duration-150 flex-shrink-0
              ${activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content: Info ─────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tentang UKM</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{ukm.description}</p>
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Kategori</p>
              <p className="text-sm font-medium text-gray-700">{ukm.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Tahun Berdiri</p>
              <p className="text-sm font-medium text-gray-700">{ukm.founded_year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(ukm.status)}`}>
                {getStatusLabel(ukm.status)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Dibuat</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(ukm.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Terakhir Diperbarui</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(ukm.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Events ───────────────────────────── */}
      {activeTab === 'events' && (
        <div>
          {/* Header tab events dengan tombol buat event */}
          {isPengurus && ukm.status === 'active' && (
            <div className="flex justify-end mb-4">
              <Button
                size="sm"
                onClick={() => setShowEventModal(true)}
                leftIcon={<FiCalendar className="w-3.5 h-3.5" />}
              >
                Buat Event
              </Button>
            </div>
          )}

          {events.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Belum Ada Event"
              message="UKM ini belum memiliki event yang tersedia."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Pengumuman ───────────────────────── */}
      {activeTab === 'announcements' && (
        <div>
          {isPengurus && ukm.status === 'active' && (
            <div className="flex justify-end mb-4">
              <Button
                size="sm"
                onClick={() => setShowAnnModal(true)}
                leftIcon={<FiBell className="w-3.5 h-3.5" />}
              >
                Buat Pengumuman
              </Button>
            </div>
          )}

          {announcements.length === 0 ? (
            <EmptyState
              icon="📢"
              title="Belum Ada Pengumuman"
              message="UKM ini belum memiliki pengumuman."
            />
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  onClick={() => navigate(`/announcements/${ann.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Anggota ──────────────────────────── */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {members.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Belum Ada Anggota"
              message="Belum ada anggota yang terdaftar di UKM ini."
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Info user */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {member.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400">{member.user?.nim}</p>
                    </div>
                  </div>

                  {/* Badge role & status */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(member.role)}`}>
                      {getStatusLabel(member.role)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(member.status)}`}>
                      {getStatusLabel(member.status)}
                    </span>

                    {/* Tombol aksi anggota (hanya pengurus/admin) */}
                    {isPengurus && member.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateMember(member.id, { status: 'active' })}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Setujui anggota"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateMember(member.id, { status: 'inactive' })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Tolak anggota"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isPengurus && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Keluarkan anggota"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Edit UKM ────────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Data UKM"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEditUKM)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama UKM</label>
            <input
              {...editForm.register('name', { required: true })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
            <select
              {...editForm.register('category', { required: true })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            >
              {UKM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Berdiri</label>
            <input
              type="number"
              {...editForm.register('founded_year', { required: true })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Logo</label>
            <input
              type="url"
              {...editForm.register('logo_url')}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              rows={4}
              {...editForm.register('description', { required: true })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>Batal</Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Ubah Status UKM ─────────────────────────── */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Ubah Status UKM"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Status UKM saat ini: <span className={`font-medium px-2 py-0.5 rounded-full text-xs border ${getStatusColor(ukm.status)}`}>{getStatusLabel(ukm.status)}</span>
        </p>
        <div className="space-y-2">
          {['pending', 'active', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => handleUpdateStatus(status)}
              disabled={ukm.status === status}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium
                transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${ukm.status === status
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <span>{getStatusLabel(status)}</span>
              {ukm.status === status && <span className="text-xs text-blue-500">Aktif sekarang</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* ── Modal Konfirmasi Hapus UKM ────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUKM}
        title="Hapus UKM"
        message={`Apakah Anda yakin ingin menghapus UKM "${ukm.name}"? Aksi ini tidak bisa dibatalkan. UKM hanya bisa dihapus jika tidak memiliki anggota aktif.`}
        confirmLabel="Ya, Hapus UKM"
        isLoading={isSubmitting}
      />

      {/* ── Modal Buat Event ──────────────────────────────── */}
      <Modal
        isOpen={showEventModal}
        onClose={() => { setShowEventModal(false); eventForm.reset() }}
        title="Buat Event Baru"
        size="lg"
      >
        <form onSubmit={eventForm.handleSubmit(handleCreateEvent)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Event <span className="text-red-500">*</span></label>
            <input
              placeholder="Nama event..."
              {...eventForm.register('title', { required: 'Judul wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
            {eventForm.formState.errors.title && <p className="mt-1 text-xs text-red-500">⚠ {eventForm.formState.errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi <span className="text-red-500">*</span></label>
            <input
              placeholder="Contoh: Aula Gedung A"
              {...eventForm.register('location', { required: 'Lokasi wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                {...eventForm.register('start_date', { required: 'Tanggal mulai wajib diisi' })}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Selesai <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                {...eventForm.register('end_date', { required: 'Tanggal selesai wajib diisi' })}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quota Peserta <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              placeholder="Jumlah maksimal peserta"
              {...eventForm.register('quota', { required: 'Quota wajib diisi', min: { value: 1, message: 'Minimal 1' } })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              placeholder="Deskripsi singkat tentang event ini..."
              {...eventForm.register('description', { required: 'Deskripsi wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowEventModal(false); eventForm.reset() }}>Batal</Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>Buat Event</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Buat Pengumuman ─────────────────────────── */}
      <Modal
        isOpen={showAnnModal}
        onClose={() => { setShowAnnModal(false); annForm.reset() }}
        title="Buat Pengumuman Baru"
        size="md"
      >
        <form onSubmit={annForm.handleSubmit(handleCreateAnn)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul <span className="text-red-500">*</span></label>
            <input
              placeholder="Judul pengumuman..."
              {...annForm.register('title', { required: 'Judul wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
            {annForm.formState.errors.title && <p className="mt-1 text-xs text-red-500">⚠ {annForm.formState.errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Isi Pengumuman <span className="text-red-500">*</span></label>
            <textarea
              rows={5}
              placeholder="Tulis isi pengumuman di sini..."
              {...annForm.register('content', { required: 'Konten wajib diisi' })}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all resize-none"
            />
            {annForm.formState.errors.content && <p className="mt-1 text-xs text-red-500">⚠ {annForm.formState.errors.content.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => { setShowAnnModal(false); annForm.reset() }}>Batal</Button>
            <Button type="submit" fullWidth isLoading={isSubmitting}>Publikasikan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// Import yang dibutuhkan UKM_CATEGORIES di dalam komponen
import { UKM_CATEGORIES } from '../../utils/constants'

export default UKMDetail
