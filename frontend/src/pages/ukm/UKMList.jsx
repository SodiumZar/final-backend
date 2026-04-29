import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import ukmService from '../../services/ukmService'
import useAuthStore from '../../store/authStore'
import { UKMCard } from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { SkeletonCard, EmptyState } from '../../components/Loading'
import { UKM_CATEGORIES } from '../../utils/constants'
import { useForm } from 'react-hook-form'

/**
 * Halaman Daftar UKM — menampilkan semua UKM yang tersedia
 * Admin bisa membuat UKM baru dan melihat semua status
 * Mahasiswa hanya melihat UKM yang active
 */
const UKMList = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  // ── State ──────────────────────────────────────────────────
  const [ukms, setUkms]           = useState([])
  const [filtered, setFiltered]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]       = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating]           = useState(false)

  // Form untuk buat UKM baru
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm()

  // ── Fetch data UKM ─────────────────────────────────────────
  const fetchUKMs = async () => {
    setIsLoading(true)
    try {
      const res = isAdmin
        ? await ukmService.getAllUKMsAdmin()
        : await ukmService.getAllUKMs()
      setUkms(res.data || [])
      setFiltered(res.data || [])
    } catch {
      toast.error('Gagal memuat daftar UKM')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUKMs()
  }, [isAdmin])

  // ── Filter & Search ────────────────────────────────────────
  useEffect(() => {
    let result = [...ukms]

    // Filter berdasarkan kata kunci pencarian
    if (search.trim()) {
      const keyword = search.toLowerCase()
      result = result.filter(
        (ukm) =>
          ukm.name?.toLowerCase().includes(keyword) ||
          ukm.description?.toLowerCase().includes(keyword) ||
          ukm.category?.toLowerCase().includes(keyword)
      )
    }

    // Filter berdasarkan kategori
    if (categoryFilter) {
      result = result.filter((ukm) => ukm.category === categoryFilter)
    }

    setFiltered(result)
  }, [search, categoryFilter, ukms])

  // ── Handler buat UKM baru ──────────────────────────────────
  const onCreateUKM = async (data) => {
    setIsCreating(true)
    try {
      const res = await ukmService.createUKM({
        ...data,
        founded_year: parseInt(data.founded_year),
      })
      toast.success('UKM berhasil dibuat! Menunggu persetujuan.')
      setUkms((prev) => [res.data, ...prev])
      setShowCreateModal(false)
      resetCreate()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal membuat UKM')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unit Kegiatan Mahasiswa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Temukan dan bergabunglah dengan UKM yang sesuai minatmu
          </p>
        </div>

        {/* Tombol Buat UKM (hanya admin) */}
        {isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<FiPlus className="w-4 h-4" />}
          >
            Buat UKM Baru
          </Button>
        )}
      </div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari UKM berdasarkan nama atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Filter kategori */}
        <div className="relative sm:w-48">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {UKM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tombol refresh */}
        <Button
          variant="secondary"
          onClick={fetchUKMs}
          leftIcon={<FiRefreshCw className="w-4 h-4" />}
          className="sm:w-auto"
        >
          Refresh
        </Button>
      </div>

      {/* ── Info hasil filter ─────────────────────────────── */}
      {(search || categoryFilter) && !isLoading && (
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold text-gray-700">{filtered.length}</span> hasil
            {search && <> untuk "<span className="font-semibold text-gray-700">{search}</span>"</>}
            {categoryFilter && <> dalam kategori <span className="font-semibold text-gray-700">{categoryFilter}</span></>}
          </p>
          <button
            onClick={() => { setSearch(''); setCategoryFilter('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* ── Grid UKM ──────────────────────────────────────── */}
      {isLoading ? (
        // Skeleton loading
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard count={6} />
        </div>
      ) : filtered.length === 0 ? (
        // Empty state
        <EmptyState
          icon="🏛️"
          title="Tidak Ada UKM Ditemukan"
          message={
            search || categoryFilter
              ? 'Tidak ada UKM yang cocok dengan filter Anda. Coba kata kunci lain.'
              : 'Belum ada UKM yang tersedia saat ini.'
          }
          action={
            (search || categoryFilter)
              ? { label: 'Hapus Filter', onClick: () => { setSearch(''); setCategoryFilter('') } }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ukm) => (
            <UKMCard
              key={ukm.id}
              ukm={ukm}
              onClick={() => navigate(`/ukms/${ukm.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── Modal Buat UKM (Admin Only) ───────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreate() }}
        title="Buat UKM Baru"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit(onCreateUKM)} className="space-y-4">

          {/* Nama UKM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama UKM <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: UKM Basket Universitas"
              {...registerCreate('name', { required: 'Nama UKM wajib diisi' })}
              className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${createErrors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'}`}
            />
            {createErrors.name && (
              <p className="mt-1 text-xs text-red-500">⚠ {createErrors.name.message}</p>
            )}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              {...registerCreate('category', { required: 'Kategori wajib dipilih' })}
              className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none ${createErrors.category ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'}`}
            >
              <option value="">Pilih kategori...</option>
              {UKM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {createErrors.category && (
              <p className="mt-1 text-xs text-red-500">⚠ {createErrors.category.message}</p>
            )}
          </div>

          {/* Tahun Berdiri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tahun Berdiri <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={`Contoh: ${new Date().getFullYear()}`}
              min="1900"
              max={new Date().getFullYear()}
              {...registerCreate('founded_year', {
                required: 'Tahun berdiri wajib diisi',
                min: { value: 1900, message: 'Tahun tidak valid' },
                max: { value: new Date().getFullYear(), message: 'Tahun tidak boleh melebihi tahun ini' },
              })}
              className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${createErrors.founded_year ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'}`}
            />
            {createErrors.founded_year && (
              <p className="mt-1 text-xs text-red-500">⚠ {createErrors.founded_year.message}</p>
            )}
          </div>

          {/* URL Logo (opsional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL Logo <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              {...registerCreate('logo_url')}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Jelaskan tentang UKM ini, visi misi, kegiatan yang dilakukan, dll."
              {...registerCreate('description', { required: 'Deskripsi wajib diisi' })}
              className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all resize-none ${createErrors.description ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'}`}
            />
            {createErrors.description && (
              <p className="mt-1 text-xs text-red-500">⚠ {createErrors.description.message}</p>
            )}
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => { setShowCreateModal(false); resetCreate() }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={isCreating}
            >
              Buat UKM
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UKMList
