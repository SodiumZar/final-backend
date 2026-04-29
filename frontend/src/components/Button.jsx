import { forwardRef } from 'react'

/**
 * Komponen Button yang reusable dengan berbagai variant, size, dan state
 * Mendukung loading state, icon, dan disabled state
 */
const Button = forwardRef(({
  children,
  variant  = 'primary',   // primary | secondary | danger | ghost | outline
  size     = 'md',        // sm | md | lg
  type     = 'button',
  isLoading = false,
  disabled  = false,
  fullWidth = false,
  leftIcon  = null,       // Element icon di kiri teks
  rightIcon = null,       // Element icon di kanan teks
  className = '',
  onClick,
  ...props
}, ref) => {

  // ── Style berdasarkan variant ──────────────────────────────
  const variantStyles = {
    primary: `
      bg-blue-600 text-white border-transparent
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500
      disabled:bg-blue-300
    `,
    secondary: `
      bg-gray-100 text-gray-700 border-transparent
      hover:bg-gray-200 active:bg-gray-300
      focus:ring-gray-400
      disabled:bg-gray-50 disabled:text-gray-400
    `,
    danger: `
      bg-red-600 text-white border-transparent
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-500
      disabled:bg-red-300
    `,
    ghost: `
      bg-transparent text-gray-600 border-transparent
      hover:bg-gray-100 active:bg-gray-200
      focus:ring-gray-400
      disabled:text-gray-300
    `,
    outline: `
      bg-transparent text-blue-600 border-blue-600
      hover:bg-blue-50 active:bg-blue-100
      focus:ring-blue-500
      disabled:text-blue-300 disabled:border-blue-300
    `,
    success: `
      bg-green-600 text-white border-transparent
      hover:bg-green-700 active:bg-green-800
      focus:ring-green-500
      disabled:bg-green-300
    `,
  }

  // ── Style berdasarkan size ─────────────────────────────────
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2   text-sm gap-2',
    lg: 'px-6 py-3   text-base gap-2',
  }

  const isDisabled = disabled || isLoading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg border
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        select-none cursor-pointer
        disabled:cursor-not-allowed disabled:opacity-70
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Spinner saat loading */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {/* Icon kiri (hanya tampil jika tidak loading) */}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}

      {/* Label button */}
      {children && <span>{children}</span>}

      {/* Icon kanan */}
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button