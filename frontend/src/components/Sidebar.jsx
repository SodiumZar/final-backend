import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiGrid, FiUsers, FiCalendar, FiBell,
  FiSettings, FiLogOut, FiUser,
  FiShield, FiList,
} from 'react-icons/fi'
import useAuthStore from '../store/authStore'
import authService from '../services/authService'
import { APP_NAME } from '../utils/constants'
import { getInitials } from '../utils/helpers'
import toast from 'react-hot-toast'

/**
 * Komponen Sidebar — navigasi vertikal untuk halaman dashboard
 * Menampilkan menu yang berbeda untuk admin dan mahasiswa
 */
const Sidebar = ({ onClose = null }) => {
  const navigate = useNavigate()
  const { user }  = useAuthStore()
  const isAdmin   = user?.role === 'admin'

  // ── Menu untuk Admin ───────────────────────────────────────
  const adminMenus = [
    {
      section: 'Manajemen',
      items: [
        { label: 'Dashboard',       href: '/dashboard',     icon: FiGrid },
        { label: 'Kelola UKM',      href: '/ukms',          icon: FiList },
        { label: 'Semua Event',     href: '/events',        icon: FiCalendar },
        { label: 'Pengumuman',      href: '/announcements', icon: FiBell },
      ],
    },
    {
      section: 'Akun',
      items: [
        { label: 'Profil Saya',     href: '/profile',       icon: FiUser },
      ],
    },
  ]

  // ── Menu untuk Mahasiswa ───────────────────────────────────
  const mahasiswaMenus = [
    {
      section: 'Menu Utama',
      items: [
        { label: 'Dashboard',       href: '/dashboard',     icon: FiGrid },
        { label: 'Jelajahi UKM',    href: '/ukms',          icon: FiUsers },
        { label: 'Event',           href: '/events',        icon: FiCalendar },
        { label: 'Pengumuman',      href: '/announcements', icon: FiBell },
      ],
    },
    {
      section: 'Akun Saya',
      items: [
        { label: 'Profil Saya',     href: '/profile',       icon: FiUser },
      ],
    },
  ]

  const menus = isAdmin ? adminMenus : mahasiswaMenus

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout()
      toast.success('Berhasil logout!')
      navigate('/login')
    } catch {
      useAuthStore.getState().clearAuth()
      navigate('/login')
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">

      {/* ── Logo & Brand ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white text-sm font-bold">U</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{APP_NAME}</p>
          <p className="text-xs text-gray-400 truncate">
            {isAdmin ? 'Panel Admin' : 'Portal Mahasiswa'}
          </p>
        </div>
        {/* Tombol close untuk mobile sidebar */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Info User ─────────────────────────────────────── */}
      <div className="px-4 py-3 mx-3 mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(user?.name || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {isAdmin
                ? <FiShield className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                : <FiUser className="w-3 h-3 text-blue-500 flex-shrink-0" />
              }
              <span className="text-xs text-gray-500 capitalize truncate">
                {isAdmin ? 'Administrator' : `Mahasiswa · ${user?.nim || ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu Navigasi ─────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {menus.map((group) => (
          <div key={group.section}>
            {/* Label section */}
            <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.section}
            </p>

            {/* Item menu */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/dashboard'}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                        {/* Dot aktif */}
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Tombol Logout ──────────────────────────────────── */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <FiLogOut className="w-4 h-4 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
