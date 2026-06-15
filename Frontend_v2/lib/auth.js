// lib/auth.js
// Session management, role checking, and auth guards.
// Import these in every admin page — never access session directly.

'use client'

import { createClient } from '@supabase/supabase-js'

// ─── CONSTANTS ───────────────────────────────────────────────────

export const ROLES = {
  OWNER:      'owner',
  MANAGER:    'manager',
  FRONT_DESK: 'front_desk',
}

// What each role can do
const PERMISSIONS = {
  view_dashboard:  [ROLES.OWNER, ROLES.MANAGER],
  view_payments:   [ROLES.OWNER, ROLES.MANAGER],
  manage_users:    [ROLES.OWNER],
  create_room:     [ROLES.OWNER, ROLES.MANAGER],
  delete_room:     [ROLES.OWNER, ROLES.MANAGER],
  cancel_booking:  [ROLES.OWNER, ROLES.MANAGER],
  view_bookings:   [ROLES.OWNER, ROLES.MANAGER, ROLES.FRONT_DESK],
  view_rooms:      [ROLES.OWNER, ROLES.MANAGER, ROLES.FRONT_DESK],
  view_receipts:   [ROLES.OWNER, ROLES.MANAGER, ROLES.FRONT_DESK],
  checkin:         [ROLES.OWNER, ROLES.MANAGER, ROLES.FRONT_DESK],
  checkout:        [ROLES.OWNER, ROLES.MANAGER, ROLES.FRONT_DESK],
}

// ─── SUPABASE CLIENT ─────────────────────────────────────────────

let _client = null

function getClient() {
  if (_client) return _client
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('[auth] Supabase env vars missing.')
    return null
  }
  _client = createClient(url, key)
  return _client
}

// ─── SESSION ─────────────────────────────────────────────────────

// Returns the full Supabase session or null
export async function getSession() {
  try {
    const sb = getClient()
    if (!sb) return null
    const { data, error } = await sb.auth.getSession()
    if (error) {
      console.error('[auth] getSession error:', error.message)
      return null
    }
    return data?.session ?? null
  } catch (e) {
    console.error('[auth] getSession threw:', e.message)
    return null
  }
}

// Returns the user object from current session or null
export async function getUser() {
  try {
    const session = await getSession()
    return session?.user ?? null
  } catch (e) {
    console.error('[auth] getUser threw:', e.message)
    return null
  }
}

// ─── ROLE ────────────────────────────────────────────────────────

// Extracts role from user metadata
// Role is stored in user.user_metadata.role by the backend on creation
export function extractRole(user) {
  if (!user) return null
  const role = user?.user_metadata?.role ?? null
  if (!Object.values(ROLES).includes(role)) {
    console.warn('[auth] Unknown role in metadata:', role)
    return null
  }
  return role
}

// Returns current user's role or null
export async function getRole() {
  const user = await getUser()
  return extractRole(user)
}

// ─── PERMISSION CHECK ────────────────────────────────────────────

// can('cancel_booking', 'manager') → true
export function can(permission, role) {
  if (!role) return false
  const allowed = PERMISSIONS[permission]
  if (!allowed) {
    console.warn('[auth] Unknown permission checked:', permission)
    return false
  }
  return allowed.includes(role)
}

// ─── AUTH GUARD HOOK ─────────────────────────────────────────────
// Use this at the top of every admin page component.
//
// Usage:
//   const { session, role, loading } = useAuthGuard()
//   if (loading) return <Spinner />
//   if (!session) return null  ← redirect already triggered
//
// Optional: pass requiredPermission to also check role access
//   const { session, role, loading, allowed } = useAuthGuard('manage_users')

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAuthGuard(requiredPermission = null) {
  const router = useRouter()
  const [state, setState] = useState({
    session: null,
    user:    null,
    role:    null,
    loading: true,
    allowed: false,
  })

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const sb = getClient()
        if (!sb) {
          if (!cancelled) setState(s => ({ ...s, loading: false }))
          return
        }

        const { data, error } = await sb.auth.getSession()

        if (error) {
          console.error('[auth] useAuthGuard session error:', error.message)
          if (!cancelled) {
            router.replace('/admin')
          }
          return
        }

        const session = data?.session ?? null

        if (!session) {
          console.warn('[auth] useAuthGuard — no session, redirecting to /admin')
          if (!cancelled) router.replace('/admin')
          return
        }

        const user = session.user
        const role = extractRole(user)

        if (!role) {
          console.error('[auth] useAuthGuard — user has no valid role:', user?.id)
          if (!cancelled) router.replace('/admin')
          return
        }

        const allowed = requiredPermission
          ? can(requiredPermission, role)
          : true

        if (!cancelled) {
          setState({ session, user, role, loading: false, allowed })
        }
      } catch (e) {
        console.error('[auth] useAuthGuard threw:', e.message)
        if (!cancelled) router.replace('/admin')
      }
    }

    check()

    // Listen for auth state changes (token refresh, sign out)
    const sb = getClient()
    let unsub = () => {}

    if (sb) {
      const { data: listener } = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          console.warn('[auth] Auth state changed — signed out, redirecting')
          router.replace('/admin')
        }
      })
      unsub = listener?.subscription?.unsubscribe ?? (() => {})
    }

    return () => {
      cancelled = true
      unsub()
    }
  }, [router, requiredPermission])

  return state
}

// ─── SIGN OUT HELPER ─────────────────────────────────────────────

export async function signOut(router) {
  try {
    const sb = getClient()
    if (sb) await sb.auth.signOut()
    console.log('[auth] Signed out successfully')
    if (router) router.replace('/admin')
  } catch (e) {
    console.error('[auth] signOut threw:', e.message)
    if (router) router.replace('/admin')
  }
}
