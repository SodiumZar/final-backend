import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import useAuthStore from './store/authStore'
import useUKMStore from './store/ukmStore'
import ukmService from './services/ukmService'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import { PageLoader } from './components/Loading'

// ─────────────────────────────────────────────────────────────
// LAZY IMPORTS — halaman dimuat hanya saat dibutuhkan
// Mengoptimalkan bundle size dan waktu loading awal
// ─────────────────────────────────────────────────────────────

// Auth pages
const Login    = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// UKM pages
const UKMList   = lazy(() => import('./pages/ukm/UKMList'))
const UKMDetail = lazy(() => import('./pages/ukm/UKMDetail'))

// Event pages
const EventList   = lazy(() => import('./pages/event/EventList'))
const EventDetail = lazy(() => import('./pages/event/EventDetail'))

// Announcement pages
const AnnouncementList = lazy(() => import('./pages/announcement/AnnouncementList'))

// Dashboard pages
const UserDashboard  = lazy(() => import('./pages/dashboard/UserDashboard'))
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'))

// Profile page
const Profile = lazy(() => import('./pages/profile/Profile'))

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTE COMPONENT
// Redirect ke /login jika user belum login
// Menyimpan lokasi tujuan agar bisa redirect balik setelah login
// ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore()
  const location       = useLocation()

  if (!isLoggedIn) {
    // Simpan lokasi tujuan ke state agar bisa redirect setelah login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// ─────────────────────────────────────────────────────────────
// GUEST ROUTE COMPONENT
// Redirect ke /dashboard jika user sudah login
// Mencegah user yang sudah login mengakses halaman login/register
// ─────────────────────────────────────────────────────────────
const GuestRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore()

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD ROUTE COMPONENT
// Mengarahkan ke dashboard yang sesuai berdasarkan role user
// admin → AdminDashboard
// mahasiswa → UserDashboard
// ─────────────────────────────────────────────────────────────
const DashboardRoute = () => {
  const { user } = useAuthStore()

  if (user?.role === 'admin') {
    return <AdminDashboard />
  }
  return <UserDashboard />
}

// ─────────────────────────────────────────────────────────────
// LAYOUT COMPONENTS
// ─────────────────────────────────────────────────────────────

/**
 * Layout publik — dengan Navbar dan Footer
 * Digunakan untuk halaman yang bisa diakses tanpa login
 */
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
)

/**
 * Layout dashboard — dengan Sidebar dan konten utama
 * Digunakan untuk halaman dashboard yang memerlukan login
 * Responsif: sidebar tersembunyi di mobile
 */
const DashboardLayout = ({ children }) => {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar tetap di atas */}
      <Navbar />

      {/* Area konten dengan sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — tersembunyi di mobile, visible di lg ke atas */}
        <div className="hidden lg:block shrink-0 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Konten utama */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// KOMPONEN UTAMA APP
// ─────────────────────────────────────────────────────────────
const App = () => {
  const { isLoggedIn } = useAuthStore()
  const { setMyUKMs }  = useUKMStore()

  // Fetch data UKM yang diikuti user saat pertama kali app dimuat
  // Agar isPengurusOf() di store bisa berfungsi dengan data terbaru
  useEffect(() => {
    const initMyUKMs = async () => {
      if (!isLoggedIn) return
      try {
        const res = await ukmService.getMyUKMs()
        setMyUKMs(res.data || [])
      } catch {
        // Abaikan error — data akan di-fetch ulang saat masuk halaman
      }
    }
    initMyUKMs()
  }, [isLoggedIn])

  return (
    // Suspense menampilkan PageLoader saat lazy component sedang dimuat
    <Suspense fallback={<PageLoader message="Memuat halaman..." />}>
      <Routes>

        {/* ══════════════════════════════════════════════════
            GUEST ROUTES — hanya untuk user yang belum login
            User yang sudah login akan di-redirect ke /dashboard
            ══════════════════════════════════════════════════ */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* ══════════════════════════════════════════════════
            PUBLIC ROUTES — bisa diakses tanpa login
            Menggunakan PublicLayout dengan Navbar + Footer
            ══════════════════════════════════════════════════ */}

        {/* Redirect root ke /ukms sebagai halaman utama */}
        <Route
          path="/"
          element={<Navigate to="/ukms" replace />}
        />

        {/* Daftar UKM */}
        <Route
          path="/ukms"
          element={
            <PublicLayout>
              <UKMList />
            </PublicLayout>
          }
        />

        {/* Detail UKM */}
        <Route
          path="/ukms/:id"
          element={
            <PublicLayout>
              <UKMDetail />
            </PublicLayout>
          }
        />

        {/* Daftar Event */}
        <Route
          path="/events"
          element={
            <PublicLayout>
              <EventList />
            </PublicLayout>
          }
        />

        {/* Detail Event */}
        <Route
          path="/events/:id"
          element={
            <PublicLayout>
              <EventDetail />
            </PublicLayout>
          }
        />

        {/* Daftar Pengumuman */}
        <Route
          path="/announcements"
          element={
            <PublicLayout>
              <AnnouncementList />
            </PublicLayout>
          }
        />

        {/* ══════════════════════════════════════════════════
            PROTECTED ROUTES — hanya untuk user yang sudah login
            Menggunakan DashboardLayout dengan Sidebar
            User yang belum login di-redirect ke /login
            ══════════════════════════════════════════════════ */}

        {/* Dashboard — otomatis arahkan ke admin/user dashboard berdasarkan role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRoute />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Profil user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ══════════════════════════════════════════════════
            FALLBACK ROUTE — 404 Not Found
            Redirect ke /ukms jika route tidak ditemukan
            ══════════════════════════════════════════════════ */}
        <Route
          path="*"
          element={
            <PublicLayout>
              {/* Halaman 404 sederhana */}
              <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
                <div className="text-7xl mb-4">🔍</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  404 — Halaman Tidak Ditemukan
                </h1>
                <p className="text-gray-500 mb-8 max-w-sm">
                  Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    ← Kembali
                  </button>
                  <a
                    href="/ukms"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  >
                    Ke Beranda
                  </a>
                </div>
              </div>
            </PublicLayout>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App