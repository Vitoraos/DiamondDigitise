'use client'

// app/pay/[paymentRef]/page.jsx
// Shows bank transfer details + card option from URL search params.
// Polls GET /payments/poll/:ref every 5s — webhook confirms on backend.
// Frontend polling only drives the redirect. Hard stop at 60s.
// Terminal states: confirmed → /booking/[ref] | incomplete_payment | cancelled

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { pollPayment } from '@/lib/api'
import GoldLine from '@/components/ui/GoldLine'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'

const POLL_INTERVAL  = 5_000
const POLL_HARD_STOP = 60_000
const TERMINAL       = new Set(['confirmed', 'incomplete_payment', 'cancelled'])

// ─── COPY BUTTON ─────────────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: '1px solid rgba(201,168,76,0.3)',
        color: copied ? '#4CAF50' : '#C9A84C',
        padding: '0.3rem 0.75rem',
        fontSize: '0.6rem', fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── PAY ROW ─────────────────────────────────────────────────────
function PayRow({ label, value, copyable }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: '1rem',
      padding: '1rem 0',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <p style={{
          fontSize: '0.9rem', fontWeight: 600,
          color: '#F5F3EE', textAlign: 'right',
          wordBreak: 'break-all',
        }}>
          {value}
        </p>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  )
}

// ─── POLLING INDICATOR ───────────────────────────────────────────
function PollingStatus({ secondsLeft }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      background: 'rgba(245,243,238,0.03)',
      border: '1px solid rgba(245,243,238,0.06)',
    }}>
      <Spinner size="sm" />
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(245,243,238,0.6)' }}>
          Waiting for payment confirmation…
        </p>
        <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(245,243,238,0.3)', marginTop: '0.2rem' }}>
          Checking automatically every 5 seconds · {secondsLeft}s remaining
        </p>
      </div>
    </div>
  )
}

// ─── TERMINAL SCREENS ────────────────────────────────────────────
function IncompleteScreen({ amountPaid, totalAmount }) {
  const shortfall = Math.max(0, (totalAmount ?? 0) - (amountPaid ?? 0))
  return (
    <div style={{
      padding: '2.5rem',
      border: '1px solid rgba(224,82,82,0.3)',
      background: 'rgba(224,82,82,0.04)',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 600, color: '#E05252', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Incomplete Payment
      </p>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F5F3EE' }}>
        We received ₦{(amountPaid ?? 0).toLocaleString()} of ₦{(totalAmount ?? 0).toLocaleString()} required.
      </p>
      {shortfall > 0 && (
        <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(245,243,238,0.5)', lineHeight: 1.6 }}>
          You're short by ₦{shortfall.toLocaleString()}. A refund will be initiated.
          Please contact the front desk with your payment reference.
        </p>
      )}
      <a href="/rooms" style={{
        display: 'inline-block', padding: '0.7rem 1.5rem',
        border: '1px solid rgba(245,243,238,0.2)',
        color: 'rgba(245,243,238,0.5)',
        fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        marginTop: '0.5rem', width: 'fit-content',
      }}>
        Browse Other Rooms
      </a>
    </div>
  )
}

function CancelledScreen() {
  return (
    <EmptyState
      title="Booking Cancelled"
      message="This booking was cancelled or expired. Your room is available for others."
      action={
        <a href="/rooms" style={{
          display: 'inline-block', padding: '0.6rem 1.5rem',
          border: '1px solid rgba(245,243,238,0.2)',
          color: 'rgba(245,243,238,0.5)',
          fontSize: '0.72rem', fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Browse Rooms
        </a>
      }
    />
  )
}

function TimedOutScreen() {
  return (
    <EmptyState
      title="Still Processing"
      message="Payment verification is taking longer than expected. Check your SMS or email for confirmation, or contact us with your reference."
      action={
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(245,243,238,0.2)',
            color: 'rgba(245,243,238,0.5)',
            padding: '0.6rem 1.5rem',
            fontSize: '0.72rem', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Refresh
        </button>
      }
    />
  )
}

// ─── PAGE ────────────────────────────────────────────────────────
export default function PayPage() {
  const params       = useParams()
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Booking data passed via URL search params from /book/[roomId]
  // /pay/HTL-REF?accountNumber=...&bankName=...&accountName=...&totalAmount=...
  // &checkoutUrl=...&guestName=...&roomNumber=...&numNights=...&bookingRef=...
  const booking = {
    accountNumber: searchParams.get('accountNumber') ?? '',
    bankName:      searchParams.get('bankName')      ?? '',
    accountName:   searchParams.get('accountName')   ?? '',
    totalAmount:   Number(searchParams.get('totalAmount') ?? 0),
    checkoutUrl:   searchParams.get('checkoutUrl')   ?? '',
    guestName:     searchParams.get('guestName')     ?? '',
    roomNumber:    searchParams.get('roomNumber')    ?? '',
    numNights:     searchParams.get('numNights')     ?? '',
    bookingRef:    searchParams.get('bookingRef')    ?? '',
  }

  const paymentRef = params?.paymentRef ?? ''

  const [pollStatus,  setPollStatus]  = useState(null)
  const [pollData,    setPollData]    = useState(null)
  const [timedOut,    setTimedOut]    = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(POLL_HARD_STOP / 1000))
  const [initError,   setInitError]   = useState(null)

  const pollRef   = useRef(null)
  const countRef  = useRef(null)
  const startedAt = useRef(Date.now())

  function stopPolling() {
    clearInterval(pollRef.current)
    clearInterval(countRef.current)
  }

  const poll = useCallback(async () => {
    if (!paymentRef) return

    const elapsed = Date.now() - startedAt.current
    if (elapsed >= POLL_HARD_STOP) {
      stopPolling()
      setTimedOut(true)
      return
    }

    const { data, error } = await pollPayment(paymentRef)

    if (error) {
      // Transient error — log and wait for next tick
      console.warn('[pay] Poll error (retrying):', error)
      return
    }

    if (!data) return

    const status = data?.status ?? null
    setPollStatus(status)
    setPollData(data)

    if (!status) return

    if (status === 'confirmed') {
      stopPolling()
      // bookingRef from URL params or from poll response
      const ref = booking.bookingRef || data?.bookingRef || data?.booking_ref || ''
      if (ref) {
        router.push(`/booking/${ref}`)
      } else {
        console.error('[pay] Confirmed but no bookingRef available')
        // Still show confirmed state — guest can go to desk
        setTimedOut(false)
      }
      return
    }

    if (TERMINAL.has(status)) {
      stopPolling()
    }
  }, [paymentRef, booking.bookingRef, router])

  useEffect(() => {
    if (!paymentRef) {
      setInitError('Invalid payment link.')
      return
    }

    // Validate search params are present
    if (!booking.accountNumber || !booking.totalAmount) {
      setInitError('Payment details missing. Please restart your booking.')
      return
    }

    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL)

    // Countdown ticker
    countRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      const left = Math.max(0, Math.floor((POLL_HARD_STOP - elapsed) / 1000))
      setSecondsLeft(left)
    }, 1000)

    return () => stopPolling()
  }, [poll, paymentRef, booking.accountNumber, booking.totalAmount])

  // ── ERROR ────────────────────────────────────────────────────────
  if (initError) {
    return (
      <main style={{ minHeight: '100svh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="Payment Error"
          message={initError}
          action={
            <a href="/rooms" style={{
              display: 'inline-block', padding: '0.6rem 1.5rem',
              border: '1px solid rgba(245,243,238,0.2)',
              color: 'rgba(245,243,238,0.5)',
              fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Start Over
            </a>
          }
        />
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E' }}>
      <section style={{ padding: '5rem 1.5rem 8rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <GoldLine />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p style={{
              fontSize: '0.65rem', fontWeight: 500,
              color: '#C9A84C', letterSpacing: '0.3em',
              textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              Complete Your Booking
            </p>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 800, letterSpacing: '-0.02em',
              color: '#F5F3EE', marginBottom: '0.5rem',
            }}>
              Make your payment.
            </h1>
            <p style={{
              fontSize: '0.85rem', fontWeight: 300,
              color: 'rgba(245,243,238,0.5)',
              lineHeight: 1.6, marginBottom: '3rem',
            }}>
              Transfer the exact amount to confirm your reservation.
              We verify automatically once received.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* Cancelled */}
            {pollStatus === 'cancelled' && (
              <motion.div key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CancelledScreen />
              </motion.div>
            )}

            {/* Incomplete */}
            {pollStatus === 'incomplete_payment' && (
              <motion.div key="incomplete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <IncompleteScreen
                  amountPaid={pollData?.amountPaid ?? pollData?.amount_paid ?? 0}
                  totalAmount={booking.totalAmount}
                />
              </motion.div>
            )}

            {/* Timed out */}
            {timedOut && !TERMINAL.has(pollStatus) && (
              <motion.div key="timedout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TimedOutScreen />
              </motion.div>
            )}

            {/* Active — payment instructions */}
            {!timedOut && !TERMINAL.has(pollStatus) && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {/* Amount due */}
                <div style={{
                  padding: '2rem',
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: '0.6rem', fontWeight: 600,
                    color: '#C9A84C', letterSpacing: '0.2em',
                    textTransform: 'uppercase', marginBottom: '0.5rem',
                  }}>
                    Amount Due
                  </p>
                  <p style={{
                    fontSize: 'clamp(2rem, 6vw, 3rem)',
                    fontWeight: 800, color: '#C9A84C',
                    letterSpacing: '-0.02em',
                  }}>
                    ₦{booking.totalAmount.toLocaleString()}
                  </p>
                  <p style={{
                    fontSize: '0.7rem', fontWeight: 300,
                    color: 'rgba(245,243,238,0.35)', marginTop: '0.4rem',
                  }}>
                    {booking.numNights} night{booking.numNights !== '1' ? 's' : ''} · Room {booking.roomNumber}
                  </p>
                </div>

                {/* Bank transfer */}
                <div style={{
                  background: '#111827',
                  border: '1px solid rgba(245,243,238,0.06)',
                  padding: '1.5rem',
                }}>
                  <p style={{
                    fontSize: '0.6rem', fontWeight: 600,
                    color: '#C9A84C', letterSpacing: '0.2em',
                    textTransform: 'uppercase', marginBottom: '0.25rem',
                  }}>
                    Bank Transfer
                  </p>
                  <p style={{
                    fontSize: '0.75rem', fontWeight: 300,
                    color: 'rgba(245,243,238,0.4)', marginBottom: '1rem',
                  }}>
                    Use your reference as the payment narration.
                  </p>

                  <div style={{ borderTop: '1px solid rgba(245,243,238,0.06)' }}>
                    <PayRow label="Bank"           value={booking.bankName} />
                    <PayRow label="Account Name"   value={booking.accountName} />
                    <PayRow label="Account Number" value={booking.accountNumber} copyable />
                    <PayRow label="Amount"         value={`₦${booking.totalAmount.toLocaleString()}`} copyable />
                    <PayRow label="Reference"      value={paymentRef} copyable />
                  </div>
                </div>

                {/* Card payment option */}
                {booking.checkoutUrl && (
                  <div style={{
                    background: '#111827',
                    border: '1px solid rgba(245,243,238,0.06)',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: '#F5F3EE', marginBottom: '0.25rem',
                      }}>
                        Prefer to pay with card?
                      </p>
                      <p style={{
                        fontSize: '0.7rem', fontWeight: 300,
                        color: 'rgba(245,243,238,0.4)',
                      }}>
                        Powered by Monnify
                      </p>
                    </div>
                    <a
                      href={booking.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '0.65rem 1.5rem',
                        border: '1px solid rgba(245,243,238,0.2)',
                        color: 'rgba(245,243,238,0.7)',
                        fontSize: '0.72rem', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        transition: 'border-color 0.2s ease, color 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C9A84C'
                        e.currentTarget.style.color = '#C9A84C'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(245,243,238,0.2)'
                        e.currentTarget.style.color = 'rgba(245,243,238,0.7)'
                      }}
                    >
                      Pay with Card →
                    </a>
                  </div>
                )}

                {/* Polling status */}
                <PollingStatus secondsLeft={secondsLeft} />

                {/* Booking summary */}
                <div style={{
                  background: '#111827',
                  border: '1px solid rgba(245,243,238,0.06)',
                  padding: '1.25rem 1.5rem',
                }}>
                  <p style={{
                    fontSize: '0.6rem', fontWeight: 600,
                    color: 'rgba(245,243,238,0.3)', letterSpacing: '0.2em',
                    textTransform: 'uppercase', marginBottom: '0.75rem',
                  }}>
                    Your Booking
                  </p>
                  <div style={{ borderTop: '1px solid rgba(245,243,238,0.06)' }}>
                    <PayRow label="Guest"     value={booking.guestName} />
                    <PayRow label="Room"      value={booking.roomNumber ? `Room ${booking.roomNumber}` : null} />
                    <PayRow label="Nights"    value={booking.numNights} />
                    <PayRow label="Reference" value={booking.bookingRef} copyable />
                  </div>
                </div>

                <p style={{
                  fontSize: '0.68rem', fontWeight: 300,
                  color: 'rgba(245,243,238,0.25)',
                  lineHeight: 1.7, textAlign: 'center',
                }}>
                  Do not close this page until payment is confirmed.
                  <br />You'll be redirected automatically once we verify your transfer.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
