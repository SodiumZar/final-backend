/**
 * Komponen Card yang reusable untuk menampilkan konten dalam kotak
 * Bisa digunakan untuk UKM card, event card, announcement card, dll.
 */

// Card utama — container dengan shadow dan rounded corner
export const Card = ({ children, className = '', hover = false, onClick }) => (
  <div
    onClick={onClick}
    className={`
      bg-white rounded-xl border border-gray-100 shadow-sm
      ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </div>
)

// Header card — bagian atas dengan border bawah opsional
export const CardHeader = ({ children, className = '', withBorder = true }) => (
  <div className={`
    px-5 py-4
    ${withBorder ? 'border-b border-gray-100' : ''}
    ${className}
  `}>
    {children}
  </div>
)

// Body card — konten utama
export const CardBody = ({ children, className = '' }) => (
  <div className={`px-5 py-4 ${className}`}>
    {children}
  </div>
)

// Footer card — bagian bawah dengan background abu-abu
export const CardFooter = ({ children, className = '' }) => (
  <div className={`
    px-5 py-3
    bg-gray-50 rounded-b-xl
    border-t border-gray-100
    ${className}
  `}>
    {children}
  </div>
)

// Card khusus untuk UKM dengan logo, nama, kategori, dan status
export const UKMCard = ({ ukm, onClick }) => {
  const statusColors = {
    active:   'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    inactive: 'bg-red-100 text-red-700',
  }
  const statusLabels = {
    active:   'Aktif',
    pending:  'Menunggu',
    inactive: 'Tidak Aktif',
  }

  return (
    <Card hover onClick={onClick} className="h-full flex flex-col">
      <CardBody className="flex-1">
        {/* Header: logo + nama + status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Logo UKM atau placeholder inisial */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
            {ukm.logo_url
              ? <img src={ukm.logo_url} alt={ukm.name} className="w-full h-full object-cover" />
              : ukm.name?.charAt(0).toUpperCase()
            }
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{ukm.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ukm.category}</p>
          </div>

          {/* Badge status */}
          <span className={`
            flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
            ${statusColors[ukm.status] || 'bg-gray-100 text-gray-600'}
          `}>
            {statusLabels[ukm.status] || ukm.status}
          </span>
        </div>

        {/* Deskripsi singkat */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {ukm.description || 'Tidak ada deskripsi.'}
        </p>
      </CardBody>

      <CardFooter>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Didirikan {ukm.founded_year || '-'}</span>
          <span className="text-blue-600 font-medium">Lihat Detail →</span>
        </div>
      </CardFooter>
    </Card>
  )
}

// Card khusus untuk Event
export const EventCard = ({ event, onClick }) => {
  const statusColors = {
    upcoming:  'bg-yellow-100 text-yellow-700',
    ongoing:   'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const statusLabels = {
    upcoming:  'Akan Datang',
    ongoing:   'Berlangsung',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  // Hitung persentase quota terisi
  const quotaPercent = event.quota
    ? Math.round(((event.approved_count || 0) / event.quota) * 100)
    : 0

  return (
    <Card hover onClick={onClick} className="h-full flex flex-col">
      <CardBody className="flex-1">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`
            text-xs font-medium px-2 py-0.5 rounded-full
            ${statusColors[event.status] || 'bg-gray-100 text-gray-600'}
          `}>
            {statusLabels[event.status] || event.status}
          </span>
          {event.ukm?.name && (
            <span className="text-xs text-gray-400">{event.ukm.name}</span>
          )}
        </div>

        {/* Judul event */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {event.title}
        </h3>

        {/* Lokasi */}
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <span>📍</span>
          <span className="truncate">{event.location || 'Lokasi belum ditentukan'}</span>
        </p>

        {/* Tanggal */}
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <span>📅</span>
          <span>
            {event.start_date
              ? new Date(event.start_date).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })
              : '-'
            }
          </span>
        </p>

        {/* Progress bar quota */}
        {event.quota && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Peserta</span>
              <span>{event.approved_count || 0}/{event.quota}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  quotaPercent >= 90 ? 'bg-red-500' :
                  quotaPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardBody>

      <CardFooter>
        <span className="text-blue-600 text-xs font-medium">Lihat Detail →</span>
      </CardFooter>
    </Card>
  )
}

// Card khusus untuk Pengumuman
export const AnnouncementCard = ({ announcement, onClick }) => (
  <Card hover onClick={onClick}>
    <CardBody>
      <div className="flex items-start gap-3">
        {/* Icon pengumuman */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          📢
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-0.5">
            {announcement.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {announcement.ukm?.name || 'UKM'}
            {' · '}
            {announcement.created_at
              ? new Date(announcement.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })
              : '-'
            }
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {announcement.content}
          </p>
        </div>
      </div>
    </CardBody>
  </Card>
)

export default Card
