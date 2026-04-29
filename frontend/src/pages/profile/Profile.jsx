import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiHash, FiShield, FiLogOut, FiEdit2, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import authService from '../../services/authService'
import Button from '../../components/Button'
import { getInitials, formatDate } from '../../utils/helpers'

/**
 * Halaman Profil — menampilkan dan memungkinkan edit data profil user
 */
const Profile = () => {
  const navigate            = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const isAdmin             = user?.role === 'admin'

  // ── State ──────────────────────────────────────────────────
  const [isEditing, setIsEditing]       = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Form edit profil
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
    },
  })

  // ── Handler Edit Profil ────────────────────────────────────
  const onSubmitEdit = async (data) => {
    try {
      // Refresh profil dari server setelah update
      await authService.getMe()
      toast.success('Profil berhasil diperbarui')
      setIsEditing(false)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui profil')
    }
  }

  // ── Handler Logout ─────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authService.logout()
      toast.success('Berhasil logout. Sampai jumpa!')
      navigate('/login')
    } catch {
      clearAuth()
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola informasi akun dan preferensi Anda
        </p>
      </div>

      {/* ── Card Profil Utama ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">

        {/* Banner gradasi atas */}
        <div className="h-20 bg-linear-to-r from-blue-500 to-indigo-600" />

        {/* Avatar & nama */}
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-4">
            {/* Avatar besar */}
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white">
              {getInitials(user?.name || '?')}
            </div>

            {/* Badge role */}
            <div className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
              ${isAdmin
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
              }
            `}>
              {isAdmin
                ? <><FiShield className="w-3 h-3" /> Administrator</>
                : <><FiUser className="w-3 h-3" /> Mahasiswa</>
              }
            </div>
          </div>

          {/* Nama & email */}
          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* ── Card Info Detail ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">Informasi Akun</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          // ── Mode Edit ───────────────────────────────────
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            {/* Field nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                {...register('name', {
                  required: 'Nama wajib diisi',
                  minLength: { value: 2, message: 'Nama minimal 2 karakter' },
                })}
                className={`
                  w-full px-3.5 py-2.5 text-sm bg-gray-50 border rounded-xl
                  focus:outline-none focus:ring-2 focus:bg-white transition-all
                  ${errors.name
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                  }
                `}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">⚠ {errors.name.message}</p>
              )}
            </div>

            {/* Info yang tidak bisa diubah */}
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              ℹ️ Email dan NIM tidak dapat diubah. Hubungi admin jika ada kesalahan data.
            </div>

            {/* Tombol aksi */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => { setIsEditing(false); reset() }}
              >
                Batal
              </Button>
              <Button type="submit" fullWidth isLoading={isSubmitting}>
                Simpan
              </Button>
            </div>
          </form>
        ) : (
          // ── Mode Tampilan ────────────────────────────────
          <div className="space-y-4">
            {[
              {
                icon:  FiUser,
                label: 'Nama Lengkap',
                value: user?.name,
                color: 'text-blue-500 bg-blue-50',
              },
              {
                icon:  FiMail,
                label: 'Email',
                value: user?.email,
                color: 'text-indigo-500 bg-indigo-50',
              },
              {
                icon:  FiHash,
                label: 'NIM',
                value: user?.nim || '-',
                color: 'text-green-500 bg-green-50',
              },
              {
                icon:  FiShield,
                label: 'Role',
                value: isAdmin ? 'Administrator' : 'Mahasiswa',
                color: isAdmin ? 'text-purple-500 bg-purple-50' : 'text-gray-500 bg-gray-50',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3.5">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                  </div>
                </div>
              )
            })}

            {/* Tanggal bergabung */}
            {user?.created_at && (
              <div className="flex items-center gap-3.5 pt-3 border-t border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                  <FiCheck className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bergabung Sejak</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Card Navigasi Cepat ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm">Menu Cepat</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
            { label: 'Jelajahi UKM', href: '/ukms', icon: '🏛️' },
            { label: 'Event', href: '/events', icon: '📅' },
            { label: 'Pengumuman', href: '/announcements', icon: '📢' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 text-sm font-medium text-gray-700 hover:text-blue-700 transition-all duration-150"
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tombol Logout ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <FiLogOut className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Keluar dari Akun</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Anda akan keluar dan perlu login kembali untuk mengakses fitur.
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          fullWidth
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<FiLogOut className="w-4 h-4" />}
        >
          Keluar dari Akun
        </Button>
      </div>
    </div>
  )
}

export default Profile
