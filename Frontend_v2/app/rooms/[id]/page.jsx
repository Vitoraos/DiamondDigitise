'use client'

// app/rooms/[id]/page.jsx
// Single room detail. Image gallery, category info, book CTA.
// Guards every field. Handles loading, error, not-found.

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getRoom } from '@/lib/api'
import { validateRoomId } from '@/lib/validate'
import Badge from '@/components/ui/Badge'
import GoldLine from '@/components/ui/GoldLine'
import EmptyState from '@/components/ui/EmptyState'

// ─── SKELETON ────────────────────────────────────────────────────
function Skeleton() {
  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E', padding: '6rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ aspectRatio: '16/9', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '14px', width: '30%', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '40px', width: '55%', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '12px', width: '90%', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '12px', width: '70%', background: '#0F1E3A' }} className="skeleton" />
      </div>
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, #111827 25%, #0F1E3A 50%, #111827 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </main>
  )
}

// ─── IMAGE GALLERY ───────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0)
  const safe = Array.isArray(images) ? images.filter(Boolean) : []

  if (safe.length === 0) {
    return (
      <div style={{
        aspectRatio: '16/9',
        background: 'linear-gradient(135deg, #0F1E3A, #061020)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '0.7rem', color: 'rgba(245,243,238,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          No images
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Main image */}
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative', background: '#0F1E3A' }}>
        <motion.img
          key={active}
          src={safe[active]}
          alt={`Room image ${active + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Thumbnails — only if more than 1 image */}
      {safe.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {safe.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0,
                width: '72px', height: '54px',
                border: `1px solid ${active === i ? '#C9A84C' : 'rgba(245,243,238,0.08)'}`,
                padding: 0,
                background: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
                opacity: active === i ? 1 : 0.5,
              }}
            >
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DETAIL ROW ──────────────────────────────────────────────────
function DetailRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: '1rem',
      padding: '0.85rem 0',
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
      <p style={{
        fontSize: '0.88rem', fontWeight: 400,
        color: '#F5F3EE', textAlign: 'right',
      }}>
        {value}
      </p>
    </div>
  )
}

// ─── BOOK CTA BOX ────────────────────────────────────────────────
function BookBox({ room }) {
  const [hovered, setHovered] = useState(false)
  const cat = room?.categories ?? {}
  const isAvailable = room?.status === 'available'

  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(245,243,238,0.06)',
      padding: '2rem',
      position: 'sticky',
      top: '2rem',
    }}>
      {/* Price */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{
          fontSize: '0.6rem', fontWeight: 600,
          color: '#C9A84C', letterSpacing: '0.2em',
          textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          {cat?.name ?? '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#F5F3EE', letterSpacing: '-0.02em' }}>
            ₦{(cat?.price_per_night ?? 0).toLocaleString()}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 300, color: 'rgba(245,243,238,0.4)' }}>
            / night
          </span>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Badge status={room?.status ?? 'unknown'} />
      </div>

      {/* CTA */}
      {isAvailable ? (
        <a
          href={`/book/${room?.id}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'block',
            width: '100%',
            padding: '1rem',
            background: hovered ? '#F5F3EE' : '#C9A84C',
            color: '#0A0F1E',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
            transition: 'background 0.25s ease',
            cursor: 'pointer',
          }}
        >
          Book This Room
        </a>
      ) : (
        <div style={{
          padding: '1rem',
          border: '1px solid rgba(245,243,238,0.08)',
          textAlign: 'center',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'rgba(245,243,238,0.3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Currently Unavailable
        </div>
      )}

      {/* Cleaning ETA — shown only when cleaning */}
      {room?.status === 'cleaning' && room?.cleaning_eta_minutes && (
        <p style={{
          marginTop: '1rem',
          fontSize: '0.72rem',
          fontWeight: 300,
          color: 'rgba(245,243,238,0.4)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Estimated ready in {room.cleaning_eta_minutes} min
        </p>
      )}

      {/* Fine print */}
      <p style={{
        marginTop: '1.5rem',
        fontSize: '0.68rem',
        fontWeight: 300,
        color: 'rgba(245,243,238,0.25)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        Payment via bank transfer or card.
        <br />Booking confirmed once payment is received.
      </p>
    </div>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────
export default function RoomDetailPage() {
  const params = useParams()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = params?.id

    // Validate ID before hitting API
    const check = validateRoomId(id)
    if (!check.ok) {
      setError('Invalid room link.')
      setLoading(false)
      return
    }

    async function load() {
      const { data, error: err } = await getRoom(id)
      if (err) {
        setError(err)
      } else if (!data) {
        setError('Room not found.')
      } else {
        setRoom(data)
      }
      setLoading(false)
    }

    load()
  }, [params?.id])

  if (loading) return <Skeleton />

  if (error) {
    return (
      <main style={{ minHeight: '100svh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="Room Not Found"
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
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              View All Rooms
            </a>
          }
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  const cat = room?.categories ?? {}

  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E' }}>

      {/* Back link */}
      <div style={{ padding: '2rem 1.5rem 0', maxWidth: '1100px', margin: '0 auto' }}>
        <a
          href="/rooms"
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
          ← All Rooms
        </a>
      </div>

      <section style={{ padding: '2rem 1.5rem 8rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <GoldLine />

          {/* Two-column layout on desktop */}
          <div className="room-detail-grid">

            {/* Left — Gallery + Details */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
            >
              {/* Gallery */}
              <Gallery images={room?.image_urls} />

              {/* Title block */}
              <div>
                <p style={{
                  fontSize: '0.6rem', fontWeight: 600,
                  color: '#C9A84C', letterSpacing: '0.25em',
                  textTransform: 'uppercase', marginBottom: '0.5rem',
                }}>
                  {cat?.name ?? '—'}
                </p>
                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  fontWeight: 800, letterSpacing: '-0.02em',
                  color: '#F5F3EE', marginBottom: '1rem',
                }}>
                  Room {room?.room_number ?? '—'}
                </h1>

                {cat?.description && (
                  <p style={{
                    fontSize: '0.95rem', fontWeight: 300,
                    color: 'rgba(245,243,238,0.6)',
                    lineHeight: 1.7, maxWidth: '540px',
                  }}>
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Detail rows */}
              <div style={{ borderTop: '1px solid rgba(245,243,238,0.06)' }}>
                <DetailRow label="Floor"        value={room?.floor ?? null} />
                <DetailRow label="Room Number"  value={room?.room_number ?? null} />
                <DetailRow label="Category"     value={cat?.name ?? null} />
                <DetailRow label="Price"        value={cat?.price_per_night ? `₦${cat.price_per_night.toLocaleString()} / night` : null} />
                <DetailRow label="Status"       value={<Badge status={room?.status} />} />
                {room?.notes && (
                  <DetailRow label="Notes" value={room.notes} />
                )}
              </div>
            </motion.div>

            {/* Right — Book box */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <BookBox room={room} />
            </motion.div>
          </div>
        </div>
      </section>

      <style>{`
        .room-detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        @media (min-width: 768px) {
          .room-detail-grid {
            grid-template-columns: 1fr 340px;
            align-items: start;
          }
        }
        .skeleton {
          background: linear-gradient(90deg, #111827 25%, #0F1E3A 50%, #111827 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}
