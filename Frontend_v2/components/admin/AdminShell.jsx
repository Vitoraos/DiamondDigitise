'use client'

// components/admin/AdminShell.jsx
// Layout wrapper for every admin page.
// Handles: auth guard, role extraction, sidebar (desktop), bottom nav (mobile).
// Usage:
//   <AdminShell requiredPermission="view_dashboard">
//     <YourPageContent role={role} />
//   </AdminShell>

import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthGuard, signOut, can } from '@/lib/auth'
import Spinner from '@/components/ui/Spinner'

// ─── NAV ITEMS ───────────────────────────────────────────────────
// Each item declares the minimum permission needed to appear
const NAV = [
  { label: 'Dashboard',  href: '/admin/dashboard',  permission: 'view_dashboard', icon: '▣' },
  { label: 'Bookings',   href: '/admin/bookings',   permission: 'view_bookings',  icon: '◈' },
  { label: 'Rooms',      href: '/admin/rooms',       permission: 'view_rooms',     icon: '⊞' },
  { label: 'Payments',   href: '/admin/payments',    permission: 'view_payments',  icon: '◎' },
  { label: 'Receipts',   href: '/admin/receipts',    permission: 'view_receipts',  icon: '◉' },
  { label: 'Users',      href: '/admin/users',       permission: 'manage_users',   icon: '◍' },
]

// ─── NAV LINK ────────────────────────────────────────────────────
function NavLink({ item, active, onClick }) {
  return (
    <a
      href={item.href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1.25rem',
        fontSize: '0.78rem',
        fontWeight: active ? 600 : 400,
        color: active ? '#C9A84C' : 'rgba(245,243,238,0.45)',
        background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
        borderLeft: `2px solid ${active ? '#C9A84C' : 'transparent'}`,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(245,243,238,0.75)'
          e.currentTarget.style.background = 'rgba(245,243,238,0.04)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(245,243,238,0.45)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{item.icon}</span>
      {item.label}
    </a>
  )
}

// ─── MOBILE BOTTOM NAV ITEM ──────────────────────────────────────
function MobileNavItem({ item, active }) {
  return (
    <a
      href={item.href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.6rem 0.5rem',
        color: active ? '#C9A84C' : 'rgba(245,243,238,0.35)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        textDecoration: 'none',
        flex: 1,
        transition: 'color 0.2s ease',
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
      <span style={{
        fontSize: '0.52rem',
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
      }}>
        {item.label}
      </span>
    </a>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────
function Sidebar({ role, pathname, onSignOut }) {
  const visibleNav = NAV.filter(item => can(item.permission, role))

  return (
    <aside style={{
      width: '220px',
      minHeight: '100svh',
      background: '#070C17',
      borderRight: '1px solid rgba(245,243,238,0.06)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100svh',
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{
        padding: '1.75rem 1.25rem 1.5rem',
        borderBottom: '1px solid rgba(245,243,238,0.06)',
      }}>
        <p style={{
          fontSize: '0.55rem', fontWeight: 600,
          color: '#C9A84C', letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: '0.3rem',
        }}>
          Diamond Residence
        </p>
        <p style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: '#F5F3EE', letterSpacing: '-0.01em',
        }}>
          Admin Panel
        </p>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(245,243,238,0.06)' }}>
        <span style={{
          fontSize: '0.55rem', fontWeight: 600,
          color: 'rgba(245,243,238,0.35)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          {role?.replace('_', ' ') ?? '—'}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        {visibleNav.map(item => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname?.startsWith(item.href) ?? false}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid rgba(245,243,238,0.06)',
      }}>
        <button
          onClick={onSignOut}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(245,243,238,0.3)',
            fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: 0,
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#E05252'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.3)'}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ─── MOBILE BOTTOM NAV ───────────────────────────────────────────
function MobileNav({ role, pathname }) {
  const visibleNav = NAV.filter(item => can(item.permission, role))

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: '#070C17',
      borderTop: '1px solid rgba(245,243,238,0.06)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {visibleNav.map(item => (
        <MobileNavItem
          key={item.href}
          item={item}
          active={pathname?.startsWith(item.href) ?? false}
        />
      ))}
    </nav>
  )
}

// ─── ACCESS DENIED ───────────────────────────────────────────────
function AccessDenied() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1rem',
      textAlign: 'center',
    }}>
      <div style={{ width: '32px', height: '1px', background: '#E05252', marginBottom: '0.5rem' }} />
      <p style={{
        fontSize: '0.6rem', fontWeight: 600,
        color: '#E05252', letterSpacing: '0.25em',
        textTransform: 'uppercase',
      }}>
        Access Denied
      </p>
      <p style={{
        fontSize: '0.85rem', fontWeight: 300,
        color: 'rgba(245,243,238,0.5)', maxWidth: '280px', lineHeight: 1.6,
      }}>
        You don't have permission to view this page.
      </p>
      <a
        href="/admin/dashboard"
        style={{
          marginTop: '0.5rem',
          fontSize: '0.68rem', fontWeight: 500,
          color: 'rgba(245,243,238,0.3)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.3)'}
      >
        ← Back to Dashboard
      </a>
    </div>
  )
}

// ─── SHELL ───────────────────────────────────────────────────────
export default function AdminShell({ children, requiredPermission = null }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { session, role, loading, allowed } = useAuthGuard(requiredPermission)

  async function handleSignOut() {
    await signOut(router)
  }

  // Loading — session check in progress
  if (loading) return <Spinner fullPage />

  // No session — useAuthGuard already redirected to /admin
  if (!session) return null

  return (
    <>
      {/* Desktop layout */}
      <div className="admin-layout">
        <Sidebar role={role} pathname={pathname} onSignOut={handleSignOut} />

        <main style={{
          flex: 1,
          minHeight: '100svh',
          background: '#0A0F1E',
          overflowX: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            {!allowed && requiredPermission ? (
              <AccessDenied key="denied" />
            ) : (
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ minHeight: '100svh' }}
              >
                {/* Pass role to children via render prop pattern */}
                {typeof children === 'function'
                  ? children({ role })
                  : children
                }
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav — overlays content */}
      <div className="admin-mobile-nav">
        <MobileNav role={role} pathname={pathname} />
      </div>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100svh;
        }
        /* Hide sidebar on mobile */
        .admin-layout > aside {
          display: flex;
        }
        /* Mobile bottom nav hidden on desktop */
        .admin-mobile-nav {
          display: none;
        }
        @media (max-width: 767px) {
          .admin-layout > aside {
            display: none !important;
          }
          .admin-mobile-nav {
            display: block;
          }
          /* Push content above mobile nav */
          .admin-layout > main {
            padding-bottom: calc(64px + env(safe-area-inset-bottom));
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
