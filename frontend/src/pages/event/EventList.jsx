import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiFilter, FiRefreshCw, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import eventService from '../../services/eventService'
import { EventCard } from '../../components/Card'
import { SkeletonCard, EmptyState } from '../../components/Loading'
import Button from '../../components/Button'

/**
 * Halaman Daftar Event — menampilkan semua event dari semua UKM
 * Bisa difilter berdasarkan status dan kata kunci pencarian
 */
const EventList = () => {
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────
  const [events, setEvents]       = useState([])
  const [filtered, setFiltered]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Fetch data event ───────────────────────────────────────
  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const res = await eventService.getAllEvents()
      setEvents(res.data || [])
      setFiltered(res.data || [])
    } catch {
      toast.error('Gagal memuat daftar event')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // ── Filter & Search ────────────────────────────────────────
  useEffect(() => {
    let result = [...events]

    // Filter berdasarkan kata kunci
    if (search.trim()) {
      const keyword = search.toLowerCase()
      result = result.filter(
        (event) =>
          event.title?.toLowerCase().includes(keyword) ||
          event.description?.toLowerCase().includes(keyword) ||
          event.location?.toLowerCase().includes(keyword)
      )
    }

    // Filter berdasarkan status event
    if (statusFilter) {
      result = result.filter((event) => event.status === statusFilter)
    }

    setFiltered(result)
  }, [search, statusFilter, events])

  // ── Pilihan filter status ──────────────────────────────────
  const statusOptions = [
    { value: '',          label: 'Semua Status' },
    { value: 'upcoming',  label: '🟡 Akan Datang' },
    { value: 'ongoing',   label: '🔵 Berlangsung' },
    { value: 'completed', label: '🟢 Selesai' },
    { value: 'cancelled', label: '🔴 Dibatalkan' },
  ]

  // ── Statistik cepat ────────────────────────────────────────
  const stats = {
    total:     events.length,
    upcoming:  events.filter((e) => e.status === 'upcoming').length,
    ongoing:   events.filter((e) => e.status === 'ongoing').length,
    completed: events.filter((e) => e.status === 'completed').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Event</h1>
        <p className="text-gray-500 text-sm mt-1">
          Temukan dan ikuti event-event menarik dari berbagai UKM kampus
        </p>
      </div>

      {/* ── Statistik Cepat ───────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Event',    value: stats.total,     color: 'bg-blue-50   text-blue-700   border-blue-100' },
            { label: 'Akan Datang',    value: stats.upcoming,  color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            { label: 'Berlangsung',    value: stats.ongoing,   color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            { label: 'Selesai',        value: stats.completed, color: 'bg-green-50  text-green-700  border-green-100' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border p-3 text-center ${stat.color}`}
            >
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari event berdasarkan judul atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Filter status */}
        <div className="relative sm:w-52">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Tombol refresh */}
        <Button
          variant="secondary"
          onClick={fetchEvents}
          leftIcon={<FiRefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* ── Info hasil filter ─────────────────────────────── */}
      {(search || statusFilter) && !isLoading && (
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-gray-500">
            Menampilkan{' '}
            <span className="font-semibold text-gray-700">{filtered.length}</span> hasil
            {search && (
              <> untuk "<span className="font-semibold text-gray-700">{search}</span>"</>
            )}
          </p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* ── Grid Event ────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard count={6} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Tidak Ada Event Ditemukan"
          message={
            search || statusFilter
              ? 'Tidak ada event yang cocok dengan filter Anda.'
              : 'Belum ada event yang tersedia saat ini.'
          }
          action={
            (search || statusFilter)
              ? { label: 'Hapus Filter', onClick: () => { setSearch(''); setStatusFilter('') } }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default EventList
