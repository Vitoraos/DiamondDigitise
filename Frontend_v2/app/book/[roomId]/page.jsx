'use client'

// app/book/[roomId]/page.jsx
// Checkout form. Validates all inputs before API call.
// On success → redirects to /pay/[paymentRef]

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { getRoom, createBooking } from '@/lib/api'
import { validateRoomId, validateBookingForm, sanitizeString, sanitizeEmail } from '@/lib/validate'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import GoldLine from '@/components/ui/GoldLine'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'

// ─── ROOM SUMMARY ────────────────────────────────────────────────
function RoomSummary({ room }) {
  const cat = room?.categories ?? {}
  const imageUrl = Array.isArray(room?.image_urls) && room.image_urls[0]
    ? room.image_urls[0]
    : null

  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(245,243,238,0.06)',
      overflow: 'hidden',
    }}>
      {/* Image */}
      <div style={{
        aspectRatio: '16/9',
        background: 'linear-gradient(135deg, #0F1E3A, #061020)',
        overflow: 'hidden',
      }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Room ${room?.room_number ?? ''}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <p style={{
          fontSize: '0.6rem', fontWeight: 600,
          color: '#C9A84C', letterSpacing: '0.2em',
          textTransform: 'uppercase', marginBottom: '0.4rem',
        }}>
          {cat?.name ?? '—'}
        </p>
        <p style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: '#F5F3EE', marginBottom: '0.75rem',
        }}>
          Room {room?.room_number ?? '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F5F3EE' }}>
            ₦{(cat?.price_per_night ?? 0).toLocaleString()}
            <span style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(245,243,238,0.4)', marginLeft: '0.25rem' }}>/night</span>
          </span>
          <Badge status={room?.status} />
        </div>
      </div>
    </div>
  )
}

// ─── TOTAL CALCULATOR ────────────────────────────────────────────
function TotalBox({ pricePerNight, numNights }) {
  const nights = Math.max(1, Number(numNights) || 1)
  const total  = (pricePerNight ?? 0) * nights

  return (
    <div style={{
      background: 'rgba(201,168,76,0.06)',
      border: '1px solid rgba(201,168,76,0.2)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(245,243,238,0.5)' }}>
          ₦{(pricePerNight ?? 0).toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#F5F3EE' }}>
          ₦{total.toLocaleString()}
        </span>
      </div>
      <div style={{
        height: '1px',
        background: 'rgba(201,168,76,0.15)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Total
        </span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C9A84C', letterSpacing: '-0.02em' }}>
          ₦{total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────
export default function BookPage() {
  const params = useParams()
  const router = useRouter()

  const [room, setRoom]       = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError]     = useState(null)

  const [form, setForm] = useState({
    guestName:  '',
    guestPhone: '',
    guestEmail: '',
    numNights:  '1',
  })
  const [errors, setErrors]   = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError]     = useState(null)

  // Load room on mount
  useEffect(() => {
    const id = params?.roomId

    const check = validateRoomId(id)
    if (!check.ok) {
      setPageError('Invalid room link.')
      setPageLoading(false)
      return
    }

    async function load() {
      const { data, error } = await getRoom(id)
      if (error) {
        setPageError(error)
      } else if (!data) {
        setPageError('Room not found.')
      } else if (data.status !== 'available') {
        setPageError('This room is no longer available.')
      } else {
        setRoom(data)
      }
      setPageLoading(false)
    }

    load()
  }, [params?.roomId])

  // Field change — sanitize on input
  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // Clear field error on change
    if (errors[name]) setErrors(e => ({ ...e, [name]: null }))
    setApiError(null)
  }

  // Submit
  async function handleSubmit() {
    setApiError(null)

    // Sanitize
    const sanitized = {
      guestName:  sanitizeString(form.guestName),
      guestPhone: sanitizeString(form.guestPhone),
      guestEmail: sanitizeEmail(form.guestEmail),
      numNights:  form.numNights,
    }

    // Validate all fields
    const { ok, errors: fieldErrors } = validateBookingForm(sanitized)
    if (!ok) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)

    const { data, error } = await createBooking({
      roomId:     params?.roomId,
      guestName:  sanitized.guestName,
      guestPhone: sanitized.guestPhone,
      guestEmail: sanitized.guestEmail,
      numNights:  Number(sanitized.numNights),
    })

    if (error) {
      setApiError(error)
      setSubmitting(false)
      return
    }

    // Guard response shape
    const paymentRef = data?.payment?.payment_reference ?? data?.paymentRef ?? null
    if (!paymentRef) {
      setApiError('Booking created but payment reference missing. Please contact support.')
      setSubmitting(false)
      return
    }

    // Success — go to payment page
    router.push(`/pay/${paymentRef}`)
  }

  // ── STATES ──────────────────────────────────────────────────────
  if (pageLoading) return <Spinner fullPage />

  if (pageError) {
    return (
      <main style={{ minHeight: '100svh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="Room Unavailable"
          message={pageError}
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
      </main>
    )
  }

  const cat = room?.categories ?? {}

  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E' }}>

      {/* Back link */}
      <div style={{ padding: '2rem 1.5rem 0', maxWidth: '1000px', margin: '0 auto' }}>
        <a
          href={`/rooms/${params?.roomId}`}
          style={{
            fontSize: '0.68rem', fontWeight: 500,
            color: 'rgba(245,243,238,0.4)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.4)'}
        >
          ← Back to Room
        </a>
      </div>

      <section style={{ padding: '2rem 1.5rem 8rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
              Book Your Stay
            </p>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 800, letterSpacing: '-0.02em',
              color: '#F5F3EE', marginBottom: '3rem',
            }}>
              Your details.
            </h1>
          </motion.div>

          <div className="book-grid">

            {/* Left — Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <Input
                label="Full Name"
                name="guestName"
                value={form.guestName}
                onChange={handleChange}
                placeholder="e.g. Chukwuemeka Obi"
                error={errors.guestName}
                required
              />
              <Input
                label="Phone Number"
                name="guestPhone"
                type="tel"
                value={form.guestPhone}
                onChange={handleChange}
                placeholder="e.g. 08012345678"
                error={errors.guestPhone}
                required
              />
              <Input
                label="Email Address"
                name="guestEmail"
                type="email"
                value={form.guestEmail}
                onChange={handleChange}
                placeholder="e.g. name@email.com"
                error={errors.guestEmail}
                required
              />
              <Input
                label="Number of Nights"
                name="numNights"
                type="number"
                value={form.numNights}
                onChange={handleChange}
                min={1}
                max={30}
                error={errors.numNights}
                required
              />

              {/* Total */}
              <TotalBox
                pricePerNight={cat?.price_per_night ?? 0}
                numNights={form.numNights}
              />

              {/* API error */}
              {apiError && (
                <p style={{
                  fontSize: '0.8rem', fontWeight: 400,
                  color: '#E05252', lineHeight: 1.5,
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(224,82,82,0.3)',
                  background: 'rgba(224,82,82,0.05)',
                }}>
                  {apiError}
                </p>
              )}

              {/* Submit */}
              <Button
                loading={submitting}
                onClick={handleSubmit}
                fullWidth
              >
                Proceed to Payment
              </Button>

              <p style={{
                fontSize: '0.68rem', fontWeight: 300,
                color: 'rgba(245,243,238,0.25)',
                lineHeight: 1.6, textAlign: 'center',
              }}>
                Your booking is held for 15 minutes once created.
                <br />Complete payment to confirm your reservation.
              </p>
            </motion.div>

            {/* Right — Room summary */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <RoomSummary room={room} />
            </motion.div>
          </div>
        </div>
      </section>

      <style>{`
        .book-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 768px) {
          .book-grid {
            grid-template-columns: 1fr 340px;
            align-items: start;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
