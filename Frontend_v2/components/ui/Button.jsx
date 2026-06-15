'use client'

// components/ui/Button.jsx
// Variants: primary | ghost | danger
// States: loading, disabled handled internally

import { useState } from 'react'

const STYLES = {
  primary: {
    background: '#C9A84C',
    color: '#0A0F1E',
    border: 'none',
    hoverBg: '#F5F3EE',
    hoverColor: '#0A0F1E',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(245,243,238,0.5)',
    border: '1px solid rgba(245,243,238,0.2)',
    hoverBg: 'transparent',
    hoverColor: '#F5F3EE',
    hoverBorder: '1px solid rgba(245,243,238,0.5)',
  },
  danger: {
    background: 'transparent',
    color: '#E05252',
    border: '1px solid #E05252',
    hoverBg: '#E05252',
    hoverColor: '#0A0F1E',
  },
}

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  small = false,
}) {
  const [hovered, setHovered] = useState(false)
  const s = STYLES[variant] || STYLES.primary
  const isDisabled = disabled || loading

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    padding: small ? '0.55rem 1.25rem' : '0.9rem 2.5rem',
    background: hovered && !isDisabled ? s.hoverBg : s.background,
    color: hovered && !isDisabled ? s.hoverColor : s.color,
    border: hovered && !isDisabled && s.hoverBorder
      ? s.hoverBorder
      : s.border || 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: small ? '0.72rem' : '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.35 : 1,
    transform: hovered && !isDisabled ? 'translateY(-2px)' : 'none',
    transition: 'all 0.25s ease',
    pointerEvents: isDisabled ? 'none' : 'auto',
  }

  return (
    <button
      type={type}
      style={style}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-disabled={isDisabled}
      aria-busy={loading}
    >
      {loading && <Spinner small />}
      {loading ? 'Please wait…' : children}
    </button>
  )
}

// Inline spinner used by Button only
function Spinner({ small }) {
  return (
    <span style={{
      width: small ? '14px' : '16px',
      height: small ? '14px' : '16px',
      border: '2px solid rgba(255,255,255,0.2)',
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
