import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

/**
 * Komponen Modal yang reusable
 * Menggunakan React Portal agar modal dirender di luar DOM tree komponen parent
 * Fitur: backdrop blur, close on Esc, close on backdrop click, animasi masuk
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size       = 'md',   // sm | md | lg | xl | full
  showFooter = false,
  footer     = null,   // Custom footer element
  closeOnBackdrop = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef(null)

  // Tutup modal saat tekan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Tidak render apapun jika modal tertutup
  if (!isOpen) return null

  // Ukuran modal berdasarkan prop size
  const sizeClasses = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-2xl',
    full: 'max-w-5xl',
  }

  // Handler klik backdrop
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  return createPortal(
    // Backdrop dengan blur
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Container modal */}
      <div
        ref={modalRef}
        className={`
          w-full ${sizeClasses[size] || sizeClasses.md}
          bg-white rounded-2xl shadow-2xl
          flex flex-col
          max-h-[90vh]
          animate-slide-up
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>

          {/* Tombol close (X) */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Tutup modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body modal — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer modal (opsional) */}
        {(showFooter || footer) && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/**
 * Modal Konfirmasi — digunakan untuk aksi destruktif (hapus, reject, dll.)
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title      = 'Konfirmasi Aksi',
  message    = 'Apakah Anda yakin ingin melanjutkan?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel  = 'Batal',
  variant    = 'danger',  // danger | primary
  isLoading  = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="py-2">
      {/* Icon peringatan */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4
        ${variant === 'danger' ? 'bg-red-100' : 'bg-blue-100'}
      `}>
        {variant === 'danger'
          ? <span className="text-2xl">⚠️</span>
          : <span className="text-2xl">❓</span>
        }
      </div>

      <p className="text-center text-gray-600 text-sm leading-relaxed">
        {message}
      </p>
    </div>

    {/* Tombol aksi */}
    <div className="flex gap-3 mt-4">
      <Button
        variant="secondary"
        fullWidth
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        variant={variant}
        fullWidth
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
)

export default Modal
