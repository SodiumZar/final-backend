import { APP_NAME } from '../utils/constants'

/**
 * Komponen Footer yang muncul di bagian bawah halaman
 */
const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Nama aplikasi dan deskripsi */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">{APP_NAME}</span>
              <span className="text-xs text-gray-400 ml-2">
                Platform Manajemen Unit Kegiatan Mahasiswa
              </span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400 text-center sm:text-right">
            © {currentYear} {APP_NAME}. Dibuat dengan ❤️ untuk kemajuan mahasiswa.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
