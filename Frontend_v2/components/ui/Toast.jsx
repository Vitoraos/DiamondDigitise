'use client'

// components/ui/Toast.jsx
// Auto-dismisses after 5 seconds
// variant: 'error' | 'success'
//
// Usage:
//   const [toast, setToast] = useState(null)
//   setToast({ message: 'Something went wrong.', variant: 'error' })
//   <Toast toast={toast} onDismiss={() => setToast(null)} />

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  const isError = toast?.variant !== 'success'
  const borderColor = isError ? '#E05252' : '#4CAF50'

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            background: '#111827',
            borderLeft: `3px solid ${borderColor}`,
            padding: '1rem 1.25rem',
            maxWidth: '320px',
            minWidth: '240px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <p style={{
              flex: 1,
              fontSize: '0.82rem',
              fontWeight: 400,
              color: '#F5F3EE',
              lineHeight: 1.5,
            }}>
              {toast.message}
            </p>
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(245,243,238,0.4)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
