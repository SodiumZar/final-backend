// ─────────────────────────────────────────────────────────────
// KONSTANTA APLIKASI UKM MANAGEMENT
// ─────────────────────────────────────────────────────────────

// Base URL API backend — diambil dari environment variable Vite
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Nama aplikasi untuk ditampilkan di UI
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'UKM Management'

// Key yang digunakan Zustand persist untuk menyimpan auth state di localStorage
export const AUTH_STORAGE_KEY = 'auth-storage'

// ─────────────────────────────────────────────────────────────
// WARNA STATUS — sesuai spesifikasi frontend
// ─────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  // Status UKM
  active:    'text-green-700  bg-green-100  border-green-200',
  inactive:  'text-red-700    bg-red-100    border-red-200',
  pending:   'text-yellow-700 bg-yellow-100 border-yellow-200',

  // Status Event
  upcoming:  'text-yellow-700 bg-yellow-100 border-yellow-200',
  ongoing:   'text-blue-700   bg-blue-100   border-blue-200',
  completed: 'text-green-700  bg-green-100  border-green-200',
  cancelled: 'text-red-700    bg-red-100    border-red-200',

  // Status Pendaftaran / Anggota
  approved:  'text-green-700  bg-green-100  border-green-200',
  rejected:  'text-red-700    bg-red-100    border-red-200',
}

// Warna dot/badge untuk status (lebih compact)
export const STATUS_DOT_COLORS = {
  active:    'bg-green-500',
  inactive:  'bg-red-500',
  pending:   'bg-yellow-500',
  upcoming:  'bg-yellow-500',
  ongoing:   'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  approved:  'bg-green-500',
  rejected:  'bg-red-500',
}

// ─────────────────────────────────────────────────────────────
// LABEL STATUS — teks tampilan dalam Bahasa Indonesia
// ─────────────────────────────────────────────────────────────
export const STATUS_LABELS = {
  // UKM
  active:    'Aktif',
  inactive:  'Tidak Aktif',
  pending:   'Menunggu',

  // Event
  upcoming:  'Akan Datang',
  ongoing:   'Sedang Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',

  // Registrant & Member
  approved:  'Disetujui',
  rejected:  'Ditolak',

  // Member role
  ketua:     'Ketua',
  pengurus:  'Pengurus',
  anggota:   'Anggota',
}

// ─────────────────────────────────────────────────────────────
// ROLE USER
// ─────────────────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN:     'admin',
  MAHASISWA: 'mahasiswa',
}

// ─────────────────────────────────────────────────────────────
// KATEGORI UKM — pilihan kategori yang tersedia
// ─────────────────────────────────────────────────────────────
export const UKM_CATEGORIES = [
  'Olahraga',
  'Seni & Budaya',
  'Akademik',
  'Kerohanian',
  'Teknologi',
  'Sosial & Kemasyarakatan',
  'Kesehatan',
  'Lingkungan',
  'Kewirausahaan',
  'Lainnya',
]

// ─────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10

// ─────────────────────────────────────────────────────────────
// PESAN ERROR UMUM
// ─────────────────────────────────────────────────────────────
export const ERROR_MESSAGES = {
  NETWORK:      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  FORBIDDEN:    'Anda tidak memiliki akses ke halaman ini.',
  NOT_FOUND:    'Data yang Anda cari tidak ditemukan.',
  SERVER:       'Terjadi kesalahan pada server. Coba lagi nanti.',
  UNKNOWN:      'Terjadi kesalahan yang tidak diketahui.',
}

// ─────────────────────────────────────────────────────────────
// VALIDASI FORM — aturan validasi untuk React Hook Form
// ─────────────────────────────────────────────────────────────
export const VALIDATION_RULES = {
  name: {
    required: 'Nama wajib diisi',
    minLength: { value: 2, message: 'Nama minimal 2 karakter' },
    maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
  },
  email: {
    required: 'Email wajib diisi',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Format email tidak valid',
    },
  },
  password: {
    required: 'Password wajib diisi',
    minLength: { value: 6, message: 'Password minimal 6 karakter' },
  },
  nim: {
    required: 'NIM wajib diisi',
    minLength: { value: 5, message: 'NIM minimal 5 karakter' },
  },
  title: {
    required: 'Judul wajib diisi',
    minLength: { value: 3, message: 'Judul minimal 3 karakter' },
  },
  content: {
    required: 'Konten wajib diisi',
    minLength: { value: 10, message: 'Konten minimal 10 karakter' },
  },
  quota: {
    required: 'Quota wajib diisi',
    min: { value: 1, message: 'Quota minimal 1' },
  },
}

// ─────────────────────────────────────────────────────────────
// ROUTE PATHS — daftar path yang digunakan di React Router
// ─────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME:              '/',
  LOGIN:             '/login',
  REGISTER:          '/register',
  DASHBOARD:         '/dashboard',
  PROFILE:           '/profile',
  UKM_LIST:          '/ukms',
  UKM_DETAIL:        '/ukms/:id',
  EVENT_LIST:        '/events',
  EVENT_DETAIL:      '/events/:id',
  ANNOUNCEMENT_LIST: '/announcements',
}