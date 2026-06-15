// components/ui/Badge.jsx
// Maps room and booking statuses to styled badges
// Never renders unknown statuses — falls back to a neutral display

const STATUS_STYLES = {
  // Room statuses
  available:          { color: '#C9A84C',               border: '#C9A84C' },
  occupied:           { color: '#F5F3EE',               border: 'rgba(245,243,238,0.4)' },
  cleaning:           { color: '#60A5FA',               border: '#60A5FA' },
  maintenance:        { color: '#E05252',               border: '#E05252' },
  // Booking statuses
  pending_payment:    { color: 'rgba(245,243,238,0.5)', border: 'rgba(245,243,238,0.1)' },
  confirmed:          { color: '#C9A84C',               border: '#C9A84C' },
  checked_in:         { color: '#4CAF50',               border: '#4CAF50' },
  checked_out:        { color: 'rgba(245,243,238,0.5)', border: 'rgba(245,243,238,0.1)' },
  cancelled:          { color: '#E05252',               border: '#E05252' },
  incomplete_payment: { color: '#E05252',               border: '#E05252' },
}

const FALLBACK = { color: 'rgba(245,243,238,0.4)', border: 'rgba(245,243,238,0.1)' }

export default function Badge({ status }) {
  if (!status || typeof status !== 'string') return null

  const key = status.toLowerCase().replace(/\s+/g, '_')
  const s = STATUS_STYLES[key] || FALLBACK

  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      padding: '0.25rem 0.75rem',
      color: s.color,
      border: `1px solid ${s.border}`,
      background: 'transparent',
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
