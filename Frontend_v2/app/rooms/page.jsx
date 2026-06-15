'use client'

// app/rooms/page.jsx
// Browse all rooms. Filter by category. Live 30s polling.
// Every response shape guarded. Every state handled.

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRooms, getRoomCategories } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import GoldLine from '@/components/ui/GoldLine'

const POLL_INTERVAL = 30_000

// ─── SKELETON CARD ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(245,243,238,0.06)' }}>
      <div style={{ aspectRatio: '4/3', background: '#0F1E3A' }} className="skeleton" />
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ height: '14px', width: '60%', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '11px', width: '80%', background: '#0F1E3A' }} className="skeleton" />
        <div style={{ height: '11px', width: '40%', background: '#0F1E3A' }} className="skeleton" />
      </div>
    </div>
  )
}

// ─── ROOM CARD ───────────────────────────────────────────────────
function RoomCard({ room, index }) {
  const [hovered, setHovered] = useState(false)

  const cat = room?.categories ?? {}
  const imageUrl = Array.isArray(room?.image_urls) && room.image_urls[0]
    ? room.image_urls[0]
    : null
  const isAvailable = room?.status === 'available'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111827',
        border: `1px solid ${hovered && isAvailable ? '#C9A84C' : 'rgba(245,243,238,0.06)'}`,
        transition: 'border-color 0.35s ease',
        display: 'flex',
        flexDirection: 'column',
        opacity: isAvailable ? 1 : 0.55,
      }}
    >
      {/* Image */}
      <div style={{
        aspectRatio: '4/3',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0F1E3A, #061020)',
      }}>
        {imageUrl && (
          <motion.img
            src={imageUrl}
            alt={`Room ${room?.room_number ?? ''}`}
            animate={{ scale: hovered && isAvailable ? 1.04 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        {/* Status badge */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
          <Badge status={room?.status ?? 'unknown'} />
        </div>

        {/* Floor tag */}
        <div style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'rgba(10,15,30,0.85)',
          padding: '0.2rem 0.6rem',
          fontSize: '0.6rem', fontWeight: 500,
          color: 'rgba(245,243,238,0.6)',
          letterSpacing: '0.1em',
        }}>
          Floor {room?.floor ?? '—'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem 1.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{
          fontSize: '0.6rem', fontWeight: 600,
          color: '#C9A84C', letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          {cat?.name ?? '—'}
        </p>

        <h3 style={{
          fontSize: '1.15rem', fontWeight: 700,
          color: '#F5F3EE', letterSpacing: '-0.01em',
        }}>
          Room {room?.room_number ?? '—'}
        </h3>

        {cat?.description && (
          <p style={{
            fontSize: '0.8rem', fontWeight: 300,
            color: 'rgba(245,243,238,0.5)',
            lineHeight: 1.6, flex: 1,
          }}>
            {cat.description}
          </p>
        )}

        <div style={{
          marginTop: '1rem',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F5F3EE' }}>
              ₦{(cat?.price_per_night ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(245,243,238,0.5)', marginLeft: '0.3rem' }}>
              /night
            </span>
          </div>

          {isAvailable ? (
            <motion.a
              href={`/rooms/${room?.id}`}
              animate={{
                opacity: hovered ? 1 : 0.7,
                background: hovered ? '#C9A84C' : 'transparent',
                color: hovered ? '#0A0F1E' : '#C9A84C',
              }}
              transition={{ duration: 0.25 }}
              style={{
                display: 'inline-block',
                padding: '0.55rem 1.25rem',
                border: '1px solid #C9A84C',
                fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Book
            </motion.a>
          ) : (
            <span style={{
              fontSize: '0.7rem', fontWeight: 500,
              color: 'rgba(245,243,238,0.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Unavailable
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── FILTER TAB ──────────────────────────────────────────────────
function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none',
        padding: '0.5rem 0',
        fontSize: '0.72rem',
        fontWeight: active ? 600 : 400,
        color: active ? '#C9A84C' : 'rgba(245,243,238,0.45)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        borderBottom: `1px solid ${active ? '#C9A84C' : 'transparent'}`,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {label}
    </button>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────
export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)

    const [roomsRes, catsRes] = await Promise.all([
      getRooms(),
      getRoomCategories(),
    ])

    if (roomsRes.error) {
      setError(roomsRes.error)
      if (!silent) setLoading(false)
      return
    }

    const roomData = Array.isArray(roomsRes.data) ? roomsRes.data : []
    const catData  = Array.isArray(catsRes.data)  ? catsRes.data  : []

    const sorted = [...roomData].sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1
      return (b.categories?.display_order ?? 0) - (a.categories?.display_order ?? 0)
    })

    setRooms(sorted)
    setCategories(catData.sort((a, b) => (b.display_order ?? 0) - (a.display_order ?? 0)))
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [load])

  const filtered = activeCat === 'all'
    ? rooms
    : rooms.filter(r => r?.categories?.id === activeCat)

  return (
    <main style={{ minHeight: '100svh', background: '#0A0F1E' }}>

      {/* Header */}
      <section style={{ padding: '6rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <GoldLine />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            style={{
              fontSize: '0.65rem', fontWeight: 500,
              color: '#C9A84C', letterSpacing: '0.3em',
              textTransform: 'uppercase', marginBottom: '1rem',
            }}
          >
            Diamond Residence
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800, letterSpacing: '-0.02em',
              color: '#F5F3EE', marginBottom: '0.5rem',
            }}
          >
            Choose your room.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontSize: '0.9rem', fontWeight: 300,
              color: 'rgba(245,243,238,0.5)',
            }}
          >
            {rooms.filter(r => r?.status === 'available').length} room
            {rooms.filter(r => r?.status === 'available').length !== 1 ? 's' : ''} available
          </motion.p>
        </div>
      </section>

      {/* Category filters */}
      {categories.length > 0 && (
        <section style={{ padding: '0 1.5rem', marginBottom: '3rem' }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'flex', gap: '2rem',
            borderBottom: '1px solid rgba(245,243,238,0.06)',
            overflowX: 'auto',
          }}>
            <FilterTab label="All Rooms" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
            {categories.map(cat => (
              <FilterTab
                key={cat?.id}
                label={cat?.name ?? '—'}
                active={activeCat === cat?.id}
                onClick={() => setActiveCat(cat?.id ?? 'all')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section style={{ padding: '0 1.5rem 8rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {loading && (
            <div className="rooms-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Could not load rooms"
              message={error}
              action={
                <button
                  onClick={() => load(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(245,243,238,0.2)',
                    color: 'rgba(245,243,238,0.5)',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.72rem', fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Retry
                </button>
              }
            />
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title="No Rooms"
              message={activeCat !== 'all' ? 'No rooms in this category.' : 'No rooms listed yet.'}
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <AnimatePresence mode="wait">
              <div key={activeCat} className="rooms-grid">
                {filtered.map((room, i) => (
                  <RoomCard key={room?.id ?? i} room={room} index={i} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Back link */}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        <a
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.7rem', fontWeight: 500,
            color: 'rgba(245,243,238,0.4)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.4)'}
        >
          ← Diamond Residence
        </a>
      </div>

      <style>{`
        .rooms-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .rooms-grid { grid-template-columns: repeat(3, 1fr); }
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
