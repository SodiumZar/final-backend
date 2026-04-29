import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import authService from '../../services/authService'
import Button from '../../components/Button'
import { VALIDATION_RULES, APP_NAME } from '../../utils/constants'

/**
 * Halaman Login — form autentikasi untuk masuk ke sistem
 * Setelah login berhasil, redirect ke dashboard atau halaman sebelumnya
 */
const Login = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  // Ambil halaman tujuan sebelum redirect ke login (jika ada)
  const from = location.state?.from?.pathname || '/dashboard'

  // Inisialisasi React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email:    '',
      password: '',
    },
  })

  // Handler submit form login
  const onSubmit = async (data) => {
    try {
      await authService.login(data)
      toast.success('Login berhasil! Selamat datang kembali 👋')
      navigate(from, { replace: true })
    } catch (error) {
      const message = error?.response?.data?.message || 'Email atau password tidak valid'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">U</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-1">Masuk ke akun Anda</p>
        </div>

        {/* ── Form Card ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 border border-white p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Field Email ─────────────────────────────── */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                {/* Icon email */}
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  {...register('email', VALIDATION_RULES.email)}
                  className={`
                    w-full pl-10 pr-4 py-2.5 text-sm
                    bg-gray-50 border rounded-xl
                    placeholder-gray-400 text-gray-900
                    focus:outline-none focus:ring-2 focus:bg-white
                    transition-all duration-150
                    ${errors.email
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400'
                    }
                  `}
                />
              </div>
              {/* Pesan error email */}
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* ── Field Password ──────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                {/* Icon kunci */}
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Minimal 6 karakter"
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
                {/* Tombol toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <FiEyeOff className="h-4 w-4" />
                    : <FiEye className="h-4 w-4" />
                  }
                </button>
              </div>
              {/* Pesan error password */}
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Tombol Submit ───────────────────────────── */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* ── Divider ─────────────────────────────────── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">atau</span>
            </div>
          </div>

          {/* ── Link ke Register ─────────────────────────── */}
          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* ── Info tambahan ────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Dengan masuk, Anda menyetujui syarat dan ketentuan yang berlaku.
        </p>
      </div>
    </div>
  )
}

export default Login