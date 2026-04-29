import { STATUS_COLORS, STATUS_LABELS, STATUS_DOT_COLORS } from './constants'

// ─────────────────────────────────────────────────────────────
// FORMAT TANGGAL & WAKTU
// ─────────────────────────────────────────────────────────────

/**
 * Memformat tanggal ke format Indonesia yang mudah dibaca
 * Contoh: "25 Januari 2024"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day:   'numeric',
      month: 'long',
      year:  'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Memformat tanggal dan waktu ke format Indonesia lengkap
 * Contoh: "25 Januari 2024, 14:30 WIB"
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day:     'numeric',
      month:   'long',
      year:    'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return '-'
  }
}

/**
 * Memformat tanggal ke format input datetime-local HTML
 * Contoh: "2024-01-25T14:30"
 */
export const formatDateTimeLocal = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    // Sesuaikan dengan timezone lokal
    const offset = date.getTimezoneOffset() * 60000
    const localDate = new Date(date - offset)
    return localDate.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

/**
 * Menghitung selisih waktu relatif dari sekarang (time ago)
 * Contoh: "2 jam lalu", "3 hari lalu"
 */
export const timeAgo = (dateString) => {
  if (!dateString) return '-'
  try {
    const date  = new Date(dateString)
    const now   = new Date()
    const diff  = now - date // selisih dalam milidetik
    const secs  = Math.floor(diff / 1000)
    const mins  = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months= Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (secs   < 60)  return 'Baru saja'
    if (mins   < 60)  return `${mins} menit lalu`
    if (hours  < 24)  return `${hours} jam lalu`
    if (days   < 7)   return `${days} hari lalu`
    if (weeks  < 4)   return `${weeks} minggu lalu`
    if (months < 12)  return `${months} bulan lalu`
    return `${years} tahun lalu`
  } catch {
    return '-'
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER STATUS
// ─────────────────────────────────────────────────────────────

/**
 * Mengambil class Tailwind CSS untuk badge status
 * Digunakan untuk menampilkan badge berwarna sesuai status
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'text-gray-700 bg-gray-100 border-gray-200'
}

/**
 * Mengambil class warna dot untuk status
 */
export const getStatusDotColor = (status) => {
  return STATUS_DOT_COLORS[status] || 'bg-gray-500'
}

/**
 * Mengambil label teks dalam Bahasa Indonesia untuk status
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status
}

// ─────────────────────────────────────────────────────────────
// HELPER STRING
// ─────────────────────────────────────────────────────────────

/**
 * Memotong teks panjang dan menambahkan "..." di akhir
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Mengubah huruf pertama setiap kata menjadi kapital
 */
export const capitalizeWords = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Menghasilkan inisial dari nama (untuk avatar placeholder)
 * Contoh: "Budi Santoso" → "BS"
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

// ─────────────────────────────────────────────────────────────
// HELPER ANGKA
// ─────────────────────────────────────────────────────────────

/**
 * Menghitung persentase quota yang terisi
 * Digunakan untuk progress bar quota event
 */
export const calculateQuotaPercentage = (approved, total) => {
  if (!total || total === 0) return 0
  const percentage = Math.round((approved / total) * 100)
  return Math.min(percentage, 100) // Maksimal 100%
}

/**
 * Menentukan warna progress bar quota berdasarkan persentase
 */
export const getQuotaBarColor = (percentage) => {
  if (percentage >= 90) return 'bg-red-500'    // Hampir penuh
  if (percentage >= 70) return 'bg-yellow-500' // Mulai penuh
  return 'bg-green-500'                         // Masih banyak sisa
}

// ─────────────────────────────────────────────────────────────
// HELPER ERROR
// ─────────────────────────────────────────────────────────────

/**
 * Mengekstrak pesan error dari response Axios
 * Menangani berbagai format error yang mungkin dikembalikan API
 */
export const getErrorMessage = (error) => {
  // Error dari response API (status bukan 2xx)
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  // Error network (tidak bisa connect ke server)
  if (error?.message === 'Network Error') {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
  }
  // Error timeout
  if (error?.code === 'ECONNABORTED') {
    return 'Waktu koneksi habis. Coba lagi nanti.'
  }
  // Fallback ke pesan error default
  return error?.message || 'Terjadi kesalahan yang tidak diketahui.'
}

// ─────────────────────────────────────────────────────────────
// HELPER VALIDASI
// ─────────────────────────────────────────────────────────────

/**
 * Memvalidasi apakah string adalah email yang valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Mengecek apakah user saat ini adalah admin
 */
export const isAdmin = (user) => {
  return user?.role === 'admin'
}

/**
 * Mengecek apakah user adalah pengurus atau ketua UKM tertentu
 * berdasarkan data keanggotaan
 */
export const isPengurusUKM = (myUKMs, ukmId) => {
  if (!myUKMs || !ukmId) return false
  const membership = myUKMs.find(m => m.ukm_id === ukmId || m.ukm?.id === ukmId)
  if (!membership) return false
  return (
    membership.status === 'active' &&
    (membership.role === 'ketua' || membership.role === 'pengurus')
  )
}

/**
 * Memformat ukuran file dari bytes ke format yang mudah dibaca
 * Contoh: 1048576 → "1.0 MB"
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
