import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiLogOut, FiUser, FiGrid } from 'react-icons/fi'
import useAuthStore from '../store/authStore'
import authService from '../services/authService'
import { APP_NAME } from '../utils/constants'
import { getInitials } from '../utils/helpers'
import toast from 'react-hot-toast'

/**
 * Komponen Navbar — header navigasi utama aplikasi
 * Menampilkan menu navigasi, info user, dan tombol logout
 * Responsif: menu hamburger untuk layar kecil
 */
const Navbar = () => {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { user, isLoggedIn } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut]     = useState(false)

  // Tutup mobile menu setiap route berubah agar menu tidak tertinggal terbuka
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Daftar menu navigasi publik
  const navLinks = [
    { label: 'UKM',          href: '/ukms' },
    { label: 'Event',        href: '/events' },
    { label: 'Pengumuman',   href: '/announcements' },
  ]

  // Cek apakah link sedang aktif
  const isActive = (href) => location.pathname.startsWith(href)

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.logout()
      toast.success('Berhasil logout. Sampai jumpa!')
      navigate('/login')
    } catch {
      // Paksa logout meski request gagal
      useAuthStore.getState().clearAuth()
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo & Brand ────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              {APP_NAME}
            </span>
          </Link>

          {/* ── Menu Navigasi Desktop ───────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(link.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Area Kanan: Auth ─────────────────────────────── */}
          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <>
                {/* Tombol Dashboard */}
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Avatar & Nama User */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  {/* Avatar dengan inisial nama */}
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-30 truncate group-hover:text-gray-900">
                    {user.name}
                  </span>
                </Link>

                {/* Tombol Logout */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Logout"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {/* Tombol Login & Register untuk user yang belum login */}
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}

            {/* Tombol hamburger menu (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <FiX className="w-5 h-5" />
                : <FiMenu className="w-5 h-5" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(link.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {link.label}
            </Link>
          ))}

          {/* Menu tambahan untuk user yang sudah login */}
          {isLoggedIn && (
            <>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <FiGrid className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <FiUser className="w-4 h-4" />
                  Profil Saya
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
