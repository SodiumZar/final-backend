/**
 * Komponen Loading dalam berbagai varian:
 * - Spinner: untuk inline loading atau button
 * - PageLoader: untuk loading halaman penuh
 * - SkeletonCard: untuk placeholder konten saat loading
 * - SkeletonText: untuk placeholder teks
 */

// Spinner animasi — untuk loading state inline
export const Spinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  }
  const colors = {
    blue:  'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray:  'border-gray-400 border-t-transparent',
    green: 'border-green-500 border-t-transparent',
  }

  return (
    <div
      className={`
        rounded-full animate-spin
        ${sizes[size] || sizes.md}
        ${colors[color] || colors.blue}
        ${className}
      `}
      role="status"
      aria-label="Memuat..."
    />
  )
}

// Page Loader — overlay loading untuk seluruh halaman
export const PageLoader = ({ message = 'Memuat...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
    <div className="flex flex-col items-center gap-3">
      {/* Logo animasi */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white text-2xl font-bold">U</span>
      </div>
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm font-medium">{message}</p>
    </div>
  </div>
)

// Skeleton Card — placeholder untuk card yang sedang dimuat
export const SkeletonCard = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse"
      >
        {/* Header skeleton */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
        {/* Body skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
        {/* Footer skeleton */}
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    ))}
  </>
)

// Skeleton Text — placeholder untuk paragraf teks
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`animate-pulse space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3 bg-gray-200 rounded"
        // Setiap baris sedikit lebih pendek dari sebelumnya untuk tampilan natural
        style={{ width: i === lines - 1 ? '60%' : `${100 - i * 5}%` }}
      />
    ))}
  </div>
)

// Empty State — tampilkan pesan saat tidak ada data
export const EmptyState = ({
  icon     = '📭',
  title    = 'Tidak ada data',
  message  = 'Belum ada data yang tersedia saat ini.',
  action   = null, // { label, onClick }
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="text-5xl mb-4 opacity-60">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
)

// Loading inline — untuk section kecil yang sedang dimuat
export const InlineLoader = ({ message = 'Memuat data...' }) => (
  <div className="flex items-center justify-center gap-3 py-8">
    <Spinner size="md" />
    <span className="text-gray-500 text-sm">{message}</span>
  </div>
)

export default Spinner
