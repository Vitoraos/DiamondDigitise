// components/ui/EmptyState.jsx
// Shown when a list or page has no data
// Never show blank space — always tell the user what's happening

export default function EmptyState({ title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem 2rem',
      textAlign: 'center',
      gap: '1rem',
    }}>
      {/* Gold line above */}
      <div style={{
        width: '32px',
        height: '1px',
        background: '#C9A84C',
        marginBottom: '0.5rem',
      }} />

      <p style={{
        fontSize: '0.6rem',
        fontWeight: 600,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: '#C9A84C',
      }}>
        {title || 'Nothing here'}
      </p>

      {message && (
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 300,
          color: 'rgba(245,243,238,0.5)',
          maxWidth: '320px',
          lineHeight: 1.6,
        }}>
          {message}
        </p>
      )}

      {action && (
        <div style={{ marginTop: '0.5rem' }}>
          {action}
        </div>
      )}
    </div>
  )
}
