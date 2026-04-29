import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiRefreshCw, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import announcementService from '../../services/announcementService'
import { SkeletonCard, EmptyState } from '../../components/Loading'
import { AnnouncementCard } from '../../components/Card'
import Button from '../../components/Button'
import { timeAgo, formatDate } from '../../utils/helpers'

/**
 * Halaman Daftar Pengumuman — menampilkan semua pengumuman dari semua UKM
 * Bisa difilter berdasarkan kata kunci pencarian
 */
const AnnouncementList = () => {
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([])
  const [filtered, setFiltered]           = useState([])
  const [isLoading, setIsLoading]         = useState(true)
  const [search, setSearch]               = useState('')
  const [selected, setSelected]           = useState(null) // Pengumuman yang sedang dipilih (panel kanan)

  // ── Fetch data pengumuman ──────────────────────────────────
  const fetchAnnouncements = async () => {
    setIsLoading(true)
    try {
      const res = await announcementService.getAllAnnouncements()
      const data = res.data || []
      setAnnouncements(data)
      setFiltered(data)
      // Pilih pengumuman pertama secara default di layar lebar
      if (data.length > 0) setSelected(data[0])
    } catch {
      toast.error('Gagal memuat daftar pengumuman')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  // ── Filter berdasarkan search ──────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(announcements)
      return
    }
    const keyword = search.toLowerCase()
    const result  = announcements.filter(
      (ann) =>
        ann.title?.toLowerCase().includes(keyword) ||
        ann.content?.toLowerCase().includes(keyword) ||
        ann.ukm?.name?.toLowerCase().includes(keyword)
    )
    setFiltered(result)
  }, [search, announcements])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
        <p className="text-gray-500 text-sm mt-1">
          Informasi terbaru dari semua Unit Kegiatan Mahasiswa
        </p>
      </div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari pengumuman atau nama UKM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>
        <Button
          variant="secondary"
          onClick={fetchAnnouncements}
          leftIcon={<FiRefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* ── Layout: daftar kiri + detail kanan ────────────── */}
      <div className="flex gap-5">

        {/* ── Panel Kiri: Daftar Pengumuman ─────────────── */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📢"
              title="Tidak Ditemukan"
              message={
                search
                  ? 'Tidak ada pengumuman yang cocok dengan pencarian Anda.'
                  : 'Belum ada pengumuman saat ini.'
              }
              action={
                search
                  ? { label: 'Hapus Pencarian', onClick: () => setSearch('') }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {/* Info jumlah hasil */}
              {search && (
                <p className="text-xs text-gray-400 px-1 mb-3">
                  {filtered.length} hasil untuk "{search}"
                </p>
              )}

              {filtered.map((ann) => (
                <button
                  key={ann.id}
                  onClick={() => setSelected(ann)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all duration-150
                    ${selected?.id === ann.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm
                      ${selected?.id === ann.id ? 'bg-blue-100' : 'bg-gray-100'}
                    `}>
                      📢
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Judul */}
                      <p className={`
                        text-sm font-semibold truncate
                        ${selected?.id === ann.id ? 'text-blue-700' : 'text-gray-800'}
                      `}>
                        {ann.title}
                      </p>

                      {/* Nama UKM + waktu */}
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {ann.ukm?.name || 'UKM'}
                        {' · '}
                        <span className="inline-flex items-center gap-0.5">
                          <FiClock className="w-2.5 h-2.5" />
                          {timeAgo(ann.created_at)}
                        </span>
                      </p>

                      {/* Preview konten */}
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Panel Kanan: Detail Pengumuman ─────────────── */}
        <div className="hidden lg:block flex-1 min-w-0">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">

              {/* Header detail */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">
                    📢
                  </div>
                  <div>
                    {selected.ukm?.name && (
                      <button
                        onClick={() => navigate(`/ukms/${selected.ukm.id || selected.ukm_id}`)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {selected.ukm.name}
                      </button>
                    )}
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <FiClock className="w-3 h-3" />
                      {formatDate(selected.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Judul */}
              <h2 className="text-xl font-bold text-gray-900 mb-4 leading-snug">
                {selected.title}
              </h2>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-4" />

              {/* Konten pengumuman */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                  {selected.content}
                </p>
              </div>

              {/* Footer: info update */}
              {selected.updated_at !== selected.created_at && (
                <p className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
                  Terakhir diperbarui: {formatDate(selected.updated_at)}
                </p>
              )}
            </div>
          ) : (
            // Empty state panel kanan
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-200">
              <span className="text-4xl mb-3 opacity-30">📢</span>
              <p className="text-sm text-gray-400">Pilih pengumuman untuk melihat isi lengkapnya</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnnouncementList
