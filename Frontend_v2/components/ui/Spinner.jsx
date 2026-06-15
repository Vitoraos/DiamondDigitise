// components/ui/Spinner.jsx
// size: 'sm' | 'md' | 'lg'
// fullPage: centers in viewport

const SIZES = {
  sm: { width: '16px', height: '16px', border: '2px solid' },
  md: { width: '28px', height: '28px', border: '2px solid' },
  lg: { width: '44px', height: '44px', border: '2px solid' },
}

export default function Spinner({ size = 'md', fullPage = false }) {
  const s = SIZES[size] || SIZES.md

  const spinner = (
    <span style={{
      display: 'inline-block',
      width: s.width,
      height: s.height,
      border: s.border,
      borderColor: 'rgba(201,168,76,0.2)',
      borderTopColor: '#C9A84C',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0F1E',
        zIndex: 9998,
      }}>
        {spinner}
      </div>
    )
  }

  return spinner
}
