import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHash } from 'react-icons/fi'
import authService from '../../services/authService'
import Button from '../../components/Button'
import { VALIDATION_RULES, APP_NAME } from '../../utils/constants'

/**
 * Halaman Register — form pendaftaran akun mahasiswa baru
 * Setelah register berhasil, langsung redirect ke dashboard
 */
const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name:             '',
      email:            '',
      nim:              '',
      password:         '',
      confirmPassword:  '',
    },
  })

  // Watch nilai password untuk validasi konfirmasi password
  const passwordValue = watch('password')

  // Handler submit form registrasi
  const onSubmit = async (data) => {
    // Hapus field confirmPassword sebelum dikirim ke API
    const { confirmPassword, ...registerData } = data

    try {
      await authService.register(registerData)
      toast.success('Akun berhasil dibuat! Selamat bergabung 🎉')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message = error?.response?.data?.message || 'Terjadi kesalahan saat mendaftar'
      toast.error(message)
    }
  }

  // Komponen helper untuk field input agar DRY
  const InputField = ({
    id, label, type = 'text', placeholder,
    icon: Icon, registration, error,
    rightElement = null,
    autoComplete,
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {/* Icon kiri */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...registration}
          className={`
            w-full pl-10 ${rightElement ? 'pr-11' : 'pr-4'} py-2.5 text-sm
            bg-gray-50 border rounded-xl
            placeholder-gray-400 text-gray-900
            focus:outline-none focus:ring-2 focus:bg-white
            transition-all duration-150
            ${error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
              : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
            }
          `}
        />
        {/* Elemen kanan (misalnya tombol show password) */}
        {rightElement}
      </div>
      {/* Pesan error */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error.message}
        </p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">U</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-1">Buat akun mahasiswa baru</p>
        </div>

        {/* ── Form Card ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-white p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* ── Field Nama Lengkap ───────────────────────── */}
            <InputField
              id="name"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              icon={FiUser}
              autoComplete="name"
              registration={register('name', VALIDATION_RULES.name)}
              error={errors.name}
            />

            {/* ── Field NIM ────────────────────────────────── */}
            <InputField
              id="nim"
              label="NIM (Nomor Induk Mahasiswa)"
              placeholder="Contoh: 123456789"
              icon={FiHash}
              autoComplete="off"
              registration={register('nim', VALIDATION_RULES.nim)}
              error={errors.nim}
            />

            {/* ── Field Email ─────────────────────────────── */}
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="nama@email.com"
              icon={FiMail}
              autoComplete="email"
              registration={register('email', VALIDATION_RULES.email)}
              error={errors.email}
            />

            {/* ── Field Password ──────────────────────────── */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  {...register('password', VALIDATION_RULES.password)}
                  className={`
                    w-full pl-10 pr-11 py-2.5 text-sm
                    bg-gray-50 border rounded-xl
                    placeholder-gray-400 text-gray-900
                    focus:outline-none focus:ring-2 focus:bg-white
                    transition-all duration-150
                    ${errors.password
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Field Konfirmasi Password ────────────────── */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Ulangi password Anda"
                  autoComplete="new-password"
                  {...register('confirmPassword', {
                    required: 'Konfirmasi password wajib diisi',
                    // Validasi: harus sama dengan field password
                    validate: (value) =>
                      value === passwordValue || 'Password tidak cocok',
                  })}
                  className={`
                    w-full pl-10 pr-11 py-2.5 text-sm
                    bg-gray-50 border rounded-xl
                    placeholder-gray-400 text-gray-900
                    focus:outline-none focus:ring-2 focus:bg-white
                    transition-all duration-150
                    ${errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* ── Info role default ─────────────────────────── */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-blue-500 text-sm mt-0.5 flex-shrink-0">ℹ️</span>
              <p className="text-xs text-blue-700 leading-relaxed">
                Akun baru akan terdaftar sebagai <strong>Mahasiswa</strong>.
                Untuk menjadi Admin, hubungi pengelola sistem.
              </p>
            </div>

            {/* ── Tombol Submit ───────────────────────────── */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? 'Mendaftarkan akun...' : 'Buat Akun'}
            </Button>
          </form>

          {/* ── Divider ─────────────────────────────────────── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">atau</span>
            </div>
          </div>

          {/* ── Link ke Login ────────────────────────────────── */}
          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Masuk sekarang
            </Link>
          </p>
        </div>

        {/* ── Footer note ──────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Dengan mendaftar, Anda menyetujui syarat dan ketentuan yang berlaku.
        </p>
      </div>
    </div>
  )
}

export default Register