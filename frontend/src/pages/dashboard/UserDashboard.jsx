import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers, FiCalendar, FiBell, FiClock,
  FiChevronRight, FiAward,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import ukmService from '../../services/ukmService'
import eventService from '../../services/eventService'
import announcementService from '../../services/announcementService'
import useAuthStore from '../../store/authStore'
import useUKMStore from '../../store/ukmStore'
import { EventCard, AnnouncementCard } from '../../components/Card'
import { InlineLoader, EmptyState } from '../../components/Loading'
import { getStatusColor, getStatusLabel, timeAgo, getInitials } from '../../utils/helpers'

/**
 * Dashboard Mahasiswa — ringkasan aktivitas user yang sedang login
 * Menampilkan: UKM yang diikuti, event yang didaftarkan, pengumuman terbaru
 */
const UserDashboard = () => {
  const navigate              = useNavigate()
  const { user }              = useAuthStore()
  const { setMyUKMs }         = useUKMStore()

  // ── State ──────────────────────────────────────────────────
  const [myUKMs, setMyUKMsLocal]     = useState([])
  const [myEvents, setMyEvents]       = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading]     = useState(true)

  // ── Fetch semua data dashboard secara paralel ──────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true)
      try {
        const [ukmRes, eventRes, annRes] = await Promise.all([
          ukmService.getMyUKMs(),
          eventService.getMyEvents(),
          announcementService.getAllAnnouncements(),
        ])

        const ukmData = ukmRes.data || []
        setMyUKMsLocal(ukmData)
        setMyUKMs(ukmData) // Sinkronkan ke store global

        setMyEvents(eventRes.data || [])
        // Ambil hanya 5 pengumuman terbaru untuk dashboard
        setAnnouncements((annRes.data || []).slice(0, 5))
      } catch {
        toast.error('Gagal memuat data dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // ── Statistik ringkas ──────────────────────────────────────
  const stats = {
    totalUKMs:    myUKMs.length,
    activeUKMs:   myUKMs.filter((m) => m.status === 'active').length,
    totalEvents:  myEvents.length,
    approvedEvents: myEvents.filter((e) => e.status === 'approved').length,
  }

  // ── UKM aktif yang diikuti ─────────────────────────────────
  const activeUKMs = myUKMs.filter((m) => m.status === 'active')

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <InlineLoader message="Memuat dashboard..." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Welcome Header ────────────────────────────────── */}
      <div className="flex items-start gap-4 mb-8">
        {/* Avatar besar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
          {getInitials(user?.name || '?')}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Halo, {user?.name?.split(' ')[0] || 'Mahasiswa'}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.nim && <span className="mr-2">NIM: {user.nim}</span>}
            Selamat datang di dashboard mahasiswa Anda.
          </p>
        </div>
      </div>

      {/* ── Kartu Statistik ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon:  FiUsers,
            label: 'UKM Diikuti',
            value: stats.totalUKMs,
            sub:   `${stats.activeUKMs} aktif`,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            icon:  FiAward,
            label: 'UKM Aktif',
            value: stats.activeUKMs,
            sub:   'keanggotaan aktif',
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            icon:  FiCalendar,
            label: 'Event Didaftar',
            value: stats.totalEvents,
            sub:   `${stats.approvedEvents} disetujui`,
            color: 'text-green-600 bg-green-50',
          },
          {
            icon:  FiBell,
            label: 'Pengumuman',
            value: announcements.length,
            sub:   'terbaru',
            color: 'text-orange-600 bg-orange-50',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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

        {/* ── Kolom Kiri (2/3): UKM & Event ─────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Section UKM yang Diikuti ──────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-blue-500" />
                UKM Saya
              </h2>
              <button
                onClick={() => navigate('/ukms')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Jelajahi UKM <FiChevronRight className="w-3 h-3" />
              </button>
            </div>

            {myUKMs.length === 0 ? (
              <EmptyState
                icon="🏛️"
                title="Belum Bergabung UKM"
                message="Anda belum bergabung dengan UKM manapun. Mulai eksplorasi sekarang!"
                action={{ label: 'Jelajahi UKM', onClick: () => navigate('/ukms') }}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {myUKMs.map((membership) => (
                  <button
                    key={membership.id}
                    onClick={() => navigate(`/ukms/${membership.ukm_id || membership.ukm?.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Logo UKM */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                      {membership.ukm?.logo_url
                        ? <img src={membership.ukm.logo_url} alt="" className="w-full h-full object-cover" />
                        : membership.ukm?.name?.charAt(0).toUpperCase() || 'U'
                      }
                    </div>

                    {/* Info UKM */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {membership.ukm?.name || 'UKM'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {membership.ukm?.category}
                      </p>
                    </div>

                    {/* Badge role & status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full border
                        ${getStatusColor(membership.role)}
                      `}>
                        {getStatusLabel(membership.role)}
                      </span>
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full border
                        ${getStatusColor(membership.status)}
                      `}>
                        {getStatusLabel(membership.status)}
                      </span>
                    </div>

                    <FiChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Section Event yang Didaftarkan ────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-green-500" />
                Event Saya
              </h2>
              <button
                onClick={() => navigate('/events')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Lihat semua event <FiChevronRight className="w-3 h-3" />
              </button>
            </div>

            {myEvents.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Belum Ada Event"
                message="Anda belum mendaftar ke event manapun."
                action={{ label: 'Cari Event', onClick: () => navigate('/events') }}
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {myEvents.slice(0, 5).map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => navigate(`/events/${reg.event_id || reg.event?.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Icon event */}
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                      <FiCalendar className="w-5 h-5" />
                    </div>

                    {/* Info event */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {reg.event?.title || 'Event'}
                      </p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <FiClock className="w-3 h-3" />
                        {reg.event?.start_date
                          ? new Date(reg.event.start_date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '-'
                        }
                      </p>
                    </div>

                    {/* Status pendaftaran */}
                    <span className={`
                      text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0
                      ${getStatusColor(reg.status)}
                    `}>
                      {getStatusLabel(reg.status)}
                    </span>

                    <FiChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}

                {/* Tombol lihat semua jika lebih dari 5 */}
                {myEvents.length > 5 && (
                  <div className="px-5 py-3 text-center">
                    <button
                      onClick={() => navigate('/events')}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Lihat {myEvents.length - 5} event lainnya →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Kolom Kanan (1/3): Pengumuman Terbaru ──────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
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

            {announcements.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">Belum ada pengumuman</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {announcements.map((ann) => (
                  <button
                    key={ann.id}
                    onClick={() => navigate('/announcements')}
                    className="w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800 line-clamp-1 mb-0.5">
                      {ann.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-1.5 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">
                        {ann.ukm?.name || 'UKM'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" />
                        {timeAgo(ann.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info Profil Singkat ──────────────────────── */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
                {getInitials(user?.name || '?')}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-blue-200">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-blue-100">
              <p>NIM: <span className="text-white font-medium">{user?.nim || '-'}</span></p>
              <p>Role: <span className="text-white font-medium capitalize">{user?.role}</span></p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 w-full text-center text-xs font-medium bg-white bg-opacity-20 hover:bg-opacity-30 py-2 rounded-lg transition-colors"
            >
              Lihat Profil Lengkap →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
