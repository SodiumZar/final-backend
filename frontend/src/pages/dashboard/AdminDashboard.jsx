import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers, FiCalendar, FiBell, FiList,
  FiChevronRight, FiCheck, FiClock, FiAlertCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import ukmService from '../../services/ukmService'
import eventService from '../../services/eventService'
import announcementService from '../../services/announcementService'
import useAuthStore from '../../store/authStore'
import Button from '../../components/Button'
import { InlineLoader } from '../../components/Loading'
import { getStatusColor, getStatusLabel, timeAgo, getInitials } from '../../utils/helpers'

/**
 * Dashboard Admin — ringkasan sistem dan akses cepat ke manajemen data
 * Menampilkan: statistik UKM, event, pengumuman, dan UKM pending approval
 */
const AdminDashboard = () => {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const isAdmin    = user?.role === 'admin'

  // ── State ──────────────────────────────────────────────────
  const [ukms, setUkms]               = useState([])
  const [events, setEvents]           = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading]     = useState(true)

  // ── Fetch semua data dashboard admin ──────────────────────
  useEffect(() => {
    if (!isAdmin) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [ukmRes, eventRes, annRes] = await Promise.all([
          ukmService.getAllUKMsAdmin(),
          eventService.getAllEvents(),
          announcementService.getAllAnnouncements(),
        ])
        setUkms(ukmRes.data || [])
        setEvents(eventRes.data || [])
        setAnnouncements(annRes.data || [])
      } catch {
        toast.error('Gagal memuat data dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [isAdmin])

  // ── Kalkulasi statistik dari data ─────────────────────────
  const stats = {
    // UKM
    totalUKMs:   ukms.length,
    activeUKMs:  ukms.filter((u) => u.status === 'active').length,
    pendingUKMs: ukms.filter((u) => u.status === 'pending').length,

    // Event
    totalEvents:    events.length,
    upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
    ongoingEvents:  events.filter((e) => e.status === 'ongoing').length,

    // Pengumuman
    totalAnnouncements: announcements.length,
  }

  // UKM yang menunggu persetujuan (status pending)
  const pendingUKMs = ukms.filter((u) => u.status === 'pending')

  // Event terbaru (5 pertama)
  const recentEvents = events.slice(0, 5)

  // Handler approve/reject UKM
  const handleUKMStatus = async (ukmId, status) => {
    try {
      await ukmService.updateUKMStatus(ukmId, status)
      toast.success(`UKM berhasil di-${status === 'active' ? 'approve' : 'reject'}`)
      // Update state lokal tanpa fetch ulang
      setUkms((prev) =>
        prev.map((u) => (u.id === ukmId ? { ...u, status } : u))
      )
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal mengubah status UKM')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <InlineLoader message="Memuat dashboard admin..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Welcome Header ────────────────────────────────── */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
          {getInitials(user?.name || 'A')}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel Admin 🛡️
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Halo, {user?.name}! Berikut ringkasan sistem UKM Management.
          </p>
        </div>
      </div>

      {/* ── Kartu Statistik Utama ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon:  FiList,
            label: 'Total UKM',
            value: stats.totalUKMs,
            sub:   `${stats.activeUKMs} aktif · ${stats.pendingUKMs} pending`,
            color: 'text-blue-600 bg-blue-50',
            urgent: stats.pendingUKMs > 0,
          },
          {
            icon:  FiCalendar,
            label: 'Total Event',
            value: stats.totalEvents,
            sub:   `${stats.upcomingEvents} akan datang · ${stats.ongoingEvents} berlangsung`,
            color: 'text-green-600 bg-green-50',
            urgent: false,
          },
          {
            icon:  FiBell,
            label: 'Pengumuman',
            value: stats.totalAnnouncements,
            sub:   'total pengumuman aktif',
            color: 'text-orange-600 bg-orange-50',
            urgent: false,
          },
          {
            icon:  FiAlertCircle,
            label: 'UKM Pending',
            value: stats.pendingUKMs,
            sub:   'menunggu persetujuan',
            color: stats.pendingUKMs > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50',
            urgent: stats.pendingUKMs > 0,
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`
                bg-white rounded-2xl border shadow-sm p-5 relative overflow-hidden
                ${stat.urgent ? 'border-red-200' : 'border-gray-100'}
              `}
            >
              {/* Indikator urgent */}
              {stat.urgent && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Layout Utama ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Kolom Kiri (2/3): Approval & Event ────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── UKM Menunggu Persetujuan ─────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">UKM Menunggu Persetujuan</h2>
                {stats.pendingUKMs > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    {stats.pendingUKMs} baru
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/ukms')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Kelola UKM <FiChevronRight className="w-3 h-3" />
              </button>
            </div>

            {pendingUKMs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-medium text-gray-600">Semua UKM Sudah Ditinjau</p>
                <p className="text-xs text-gray-400 mt-1">Tidak ada UKM yang menunggu persetujuan.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingUKMs.map((ukm) => (
                  <div
                    key={ukm.id}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Logo UKM */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                      {ukm.logo_url
                        ? <img src={ukm.logo_url} alt={ukm.name} className="w-full h-full object-cover" />
                        : ukm.name?.charAt(0).toUpperCase()
                      }
                    </div>

                    {/* Info UKM */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{ukm.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {ukm.category} · Berdiri {ukm.founded_year}
                      </p>
                    </div>

                    {/* Tombol approve/reject */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUKMStatus(ukm.id, 'active')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                        title="Setujui UKM"
                      >
                        <FiCheck className="w-3 h-3" />
                        Setujui
                      </button>
                      <button
                        onClick={() => handleUKMStatus(ukm.id, 'inactive')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        title="Tolak UKM"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => navigate(`/ukms/${ukm.id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Lihat detail"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Event Terbaru ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-green-500" />
                Event Terbaru
              </h2>
              <button
                onClick={() => navigate('/events')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Semua event <FiChevronRight className="w-3 h-3" />
              </button>
            </div>

            {recentEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400">Belum ada event yang dibuat.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Dot status event */}
                    <div className={`
                      w-2 h-2 rounded-full flex-shrink-0
                      ${event.status === 'upcoming'  ? 'bg-yellow-400' :
                        event.status === 'ongoing'   ? 'bg-blue-500'   :
                        event.status === 'completed' ? 'bg-green-500'  : 'bg-red-400'}
                    `} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {event.ukm?.name || 'UKM'} · {event.location}
                      </p>
                    </div>

                    <span className={`
                      text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0
                      ${getStatusColor(event.status)}
                    `}>
                      {getStatusLabel(event.status)}
                    </span>

                    <FiChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Kolom Kanan (1/3): Aksi Cepat & Pengumuman ── */}
        <div className="space-y-5">

          {/* ── Quick Actions ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              {[
                { label: 'Kelola UKM',        href: '/ukms',          icon: '🏛️', color: 'hover:bg-blue-50 hover:border-blue-200' },
                { label: 'Lihat Semua Event', href: '/events',        icon: '📅', color: 'hover:bg-green-50 hover:border-green-200' },
                { label: 'Pengumuman',        href: '/announcements', icon: '📢', color: 'hover:bg-orange-50 hover:border-orange-200' },
                { label: 'Profil Saya',       href: '/profile',       icon: '👤', color: 'hover:bg-gray-50 hover:border-gray-300' },
              ].map((action) => (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                    border border-gray-100 text-sm font-medium text-gray-700
                    transition-all duration-150 ${action.color}
                  `}
                >
                  <span className="text-base">{action.icon}</span>
                  {action.label}
                  <FiChevronRight className="ml-auto w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Pengumuman Terbaru ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <FiBell className="w-4 h-4 text-orange-500" />
                Pengumuman Terbaru
              </h2>
              <button
                onClick={() => navigate('/announcements')}
                className="text-xs text-blue-600 hover:underline"
              >
                Semua
              </button>
            </div>

            {announcements.slice(0, 4).length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-gray-400">Belum ada pengumuman</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="px-5 py-3">
                    <p className="text-xs font-semibold text-gray-700 line-clamp-1">
                      {ann.title}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-blue-600">{ann.ukm?.name}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" />
                        {timeAgo(ann.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info Admin Card ─────────────────────────────── */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold">
                {getInitials(user?.name || 'A')}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-indigo-200">Administrator</p>
              </div>
            </div>
            {/* Ringkasan sistem */}
            <div className="space-y-2 text-xs text-indigo-200">
              <div className="flex justify-between">
                <span>Total UKM</span>
                <span className="text-white font-semibold">{stats.totalUKMs}</span>
              </div>
              <div className="flex justify-between">
                <span>UKM Aktif</span>
                <span className="text-white font-semibold">{stats.activeUKMs}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Event</span>
                <span className="text-white font-semibold">{stats.totalEvents}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
