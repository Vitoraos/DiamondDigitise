'use client'

// app/booking/[ref]/page.jsx
// Confirmation page shown after payment confirmed.
// Fetches booking by ref (bookingRef, paymentRef, or receiptNumber).
// Shows booking details + receipt PDF link.
// ref param is guarded before any API call.

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getBookingByRef } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import GoldLine from '@/components/ui/GoldLine'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

// ─── HELPERS ─────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// ─── DETAIL ROW ──────────────────────────────────────────────────
function Row({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1rem',
      padding: '0.9rem 0',
      borderBottom: '1px solid rgba(245,243,238,0.06)',
    }}>
      <p style={{
        fontSize: '0.65rem', fontWeight: 500,
        color: 'rgba(245,243,238,0.4)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        {label}
      </p>
      <div style={{ textAlign: 'right' }}>
        {typeof value === 'string' || typeof value === 'number'
          ? (
            <p style={{ fontSize: '0.88rem', fontWeight: 400, color: '#F5F3EE' }}>
              {value}
            </p>
          )
          : value
        }
      </div>
    </div>
  )
}

// ─── CONFIRMATION BANNER ─────────────────────────────────────────
function ConfirmedBanner({ bookingRef }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(76,175,80,0.06)',
        border: '1px solid rgba(76,175,80,0.25)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '2rem',
      }}
    >
      <p style={{
        fontSize: '0.6rem', fontWeight: 600,
        color: '#4CAF50', letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        Payment Confirmed
      </p>
      <p style={{
        fontSize: '1rem', fontWeight: 700,
        color: '#F5F3EE',
      }}>
        Your booking is confirmed.
      </p>
      <p style={{
        fontSize: '0.78rem', fontWeight: 300,
        color: 'rgba(245,243,238,0.5)', lineHeight: 1.6,
      }}>
        Reference: <span style={{ color: '#C9A84C', fontWeight: 600 }}>{bookingRef}</span>
        <br />Present this at the front desk on arrival.
      </p>
    </motion.div>
  )
}

// ─── RECEIPT BLOCK ───────────────────────────────────────────────
function ReceiptBlock({ receipts }) {
  const safe = Array.isArray(receipts) ? receipts.filter(Boolean) : []
  if (safe.length === 0) return null

  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(245,243,238,0.06)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <p style={{
        fontSize: '0.6rem', fontWeight: 600,
        color: '#C9A84C', letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        Receipt{safe.length > 1 ? 's' : ''}
      </p>

      {safe.map((receipt, i) => {
        const pdfUrl        = receipt?.pdf_url ?? null
        const receiptNumber = receipt?.receipt_number ?? `Receipt ${i + 1}`
        const issuedAt      = receipt?.issued_at ?? null

        return (
          <div
            key={receipt?.receipt_number ?? i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: i > 0 ? '1rem' : 0,
              borderTop: i > 0 ? '1px solid rgba(245,243,238,0.06)' : 'none',
            }}
          >
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F5F3EE' }}>
                {receiptNumber}
              </p>
              {issuedAt && (
                <p style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(245,243,238,0.4)', marginTop: '0.2rem' }}>
                  Issued {formatDate(issuedAt)} at {formatTime(issuedAt)}
                </p>
              )}
            </div>

            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.55rem 1.25rem',
                  border: '1px solid #C9A84C',
                  color: '#C9A84C',
                  fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'background 0.2s ease, color 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#C9A84C'
                  e.currentTarget.style.color = '#0A0F1E'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#C9A84C'
                }}
              >
                Download PDF
              </a>
            ) : (
              <p style={{
                fontSize: '0.7rem', fontWeight: 300,
                color: 'rgba(245,243,238,0.3)',
              }}>
                PDF not yet available
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────
export default function BookingConfirmationPage() {
  const params = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const ref = params?.ref

    // Guard ref before API call
    if (!ref || typeof ref !== 'string' || ref.trim().length < 3) {
      setError('Invalid booking reference.')
      setLoading(false)
      return
    }

    // Sanitize ref — strip anything that isn't alphanumeric, dash, or uppercase
    const safeRef = ref.trim().replace(/[^a-zA-Z0-9\-]/g, '')
    if (!safeRef) {
      setError('Invalid booking reference.')
      setLoading(false)
      return
    }

    async function load() {
      const { data, error: err } = await getBookingByRef(safeRef)

      if (err) {
        setError(err)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Booking not found.')
        setLoading(false)
        return
      }

      setBooking(data)
      setLoading(false)
    }

    load()
  }, [params?.ref])

  // ── STATES ──────────────────────────────────────────────────────
  if (loading) return <Spinner fullPage />

  if (error) {
    return (
      <main style={{
        minHeight: '100svh', background: '#0A0F1E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <EmptyState
          title="Booking Not Found"
          message={error}
          action={
            <a
              href="/rooms"
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.5rem',
                border: '1px solid rgba(245,243,238,0.2)',
                color: 'rgba(245,243,238,0.5)',
                fontSize: '0.72rem', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Browse Rooms
            </a>
          }
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // Safe field extraction
  const bookingRef   = booking?.booking_ref    ?? '—'
  const status       = booking?.status         ?? null
  const numNights    = booking?.num_nights      ?? null
  const totalAmount  = booking?.total_amount    ?? null
  const checkInAt    = booking?.check_in_at     ?? null
  const checkOutAt   = booking?.check_out_at    ?? null
  const guestName    = booking?.guests?.name    ?? '—'
  const guestPhone   = booking?.guests?.phone   ?? null
  const roomNumber   = booking?.rooms?.room_number ?? '—'
  const floor        = booking?.rooms?.floor    ?? null
  const categoryName = booking?.categories?.name ?? '—'
  const receipts     = booking?.receipts        ?? []
  const amountPaid   = booking?.payments?.amount_received ?? null
  const payStatus    = booking?.payments?.status ?? null

  const isConfirmed  = ['confirmed', 'checked_in', 'checked_out'].includes(status)

  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E' }}>
      <section style={{ padding: '5rem 1.5rem 8rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <GoldLine />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '2.5rem' }}
          >
            <p style={{
              fontSize: '0.65rem', fontWeight: 500,
              color: '#C9A84C', letterSpacing: '0.3em',
              textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              Diamond Residence
            </p>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 800, letterSpacing: '-0.02em',
              color: '#F5F3EE',
            }}>
              {isConfirmed ? 'You\'re all set.' : 'Booking Details.'}
            </h1>
          </motion.div>

          {/* Confirmed banner */}
          {isConfirmed && <ConfirmedBanner bookingRef={bookingRef} />}

          {/* Main booking card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: '#111827',
              border: '1px solid rgba(245,243,238,0.06)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(245,243,238,0.06)',
            }}>
              <p style={{
                fontSize: '0.6rem', fontWeight: 600,
                color: '#C9A84C', letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}>
                Booking Summary
              </p>
              {status && <Badge status={status} />}
            </div>

            <div style={{ borderTop: '1px solid rgba(245,243,238,0.06)' }}>
              <Row label="Reference"   value={bookingRef} />
              <Row label="Guest"       value={guestName} />
              {guestPhone && <Row label="Phone" value={guestPhone} />}
              <Row label="Room"        value={`Room ${roomNumber}${floor ? ` · Floor ${floor}` : ''}`} />
              <Row label="Category"    value={categoryName} />
              <Row label="Nights"      value={numNights} />
              {checkInAt && (
                <Row
                  label="Check-in"
                  value={`${formatDate(checkInAt)}${formatTime(checkInAt) ? ` · ${formatTime(checkInAt)}` : ''}`}
                />
              )}
              {checkOutAt && (
                <Row
                  label="Check-out"
                  value={`${formatDate(checkOutAt)}${formatTime(checkOutAt) ? ` · ${formatTime(checkOutAt)}` : ''}`}
                />
              )}
            </div>
          </motion.div>

          {/* Payment summary */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: '#111827',
              border: '1px solid rgba(245,243,238,0.06)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{
              fontSize: '0.6rem', fontWeight: 600,
              color: '#C9A84C', letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(245,243,238,0.06)',
            }}>
              Payment
            </p>

            <div style={{ borderTop: '1px solid rgba(245,243,238,0.06)' }}>
              {totalAmount !== null && (
                <Row label="Total"  value={`₦${Number(totalAmount).toLocaleString()}`} />
              )}
              {amountPaid !== null && (
                <Row label="Paid"   value={`₦${Number(amountPaid).toLocaleString()}`} />
              )}
              {payStatus && (
                <Row label="Status" value={<Badge status={payStatus} />} />
              )}
            </div>
          </motion.div>

          {/* Receipt block */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ReceiptBlock receipts={receipts} />
          </motion.div>

          {/* Footer actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontSize: '0.75rem', fontWeight: 300,
              color: 'rgba(245,243,238,0.35)',
              lineHeight: 1.7,
            }}>
              Show this page or your reference number at the front desk on arrival.
              <br />Need help? Contact Diamond Residence directly.
            </p>

            <a
              href="/rooms"
              style={{
                fontSize: '0.68rem', fontWeight: 500,
                color: 'rgba(245,243,238,0.3)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.3)'}
            >
              ← Browse More Rooms
            </a>
          </motion.div>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
