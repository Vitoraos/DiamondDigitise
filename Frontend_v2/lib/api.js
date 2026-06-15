// lib/api.js
// Every API call lives here. One function, one job.
// Every user input is treated as an attack.
// Every response shape is guarded.

import { createClient } from '@supabase/supabase-js'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

if (!BASE) {
  console.error('[api] NEXT_PUBLIC_API_BASE_URL is not set.')
}

// ─── ERROR MAP ───────────────────────────────────────────────────
// Maps API error codes → human-readable UI messages
const ERROR_MAP = {
  ROOM_UNAVAILABLE:      'This room was just taken. Please pick another.',
  ROOM_DOUBLE_BOOKED:    'Room no longer available.',
  NOT_VERIFIED:          'Booking must be confirmed (paid) first.',
  NOT_CHECKED_IN:        'Guest is not currently checked in.',
  CLEANING_AUTO_ONLY:    'Cleaning status is set automatically on checkout.',
  INVALID_TRANSITION:    'This status change is not allowed.',
  SELF_DEACTIVATION:     'You cannot deactivate your own account.',
  USER_EXISTS:           'A user with this email already exists.',
  INSUFFICIENT_PAYMENT:  'Payment received was less than the required amount.',
  400:                   'Invalid request. Please check your input.',
  401:                   'Session expired. Please log in again.',
  403:                   "You don't have permission for this action.",
  404:                   'Not found.',
  409:                   'Action conflicts with current state.',
  422:                   'Action not allowed at this stage.',
  500:                   'Server error. Please try again.',
  network:               'Connection failed. Check your internet.',
}

function resolveError(status, json) {
  // Check operational code first
  const code = json?.code
  if (code && ERROR_MAP[code]) return ERROR_MAP[code]

  // Check validation fields (400)
  if (status === 400 && Array.isArray(json?.fields) && json.fields.length > 0) {
    return json.fields.map(f => f.message).join(' ')
  }

  // Fall back to status map
  if (ERROR_MAP[status]) return ERROR_MAP[status]

  // Fall back to API error string if safe
  if (typeof json?.error === 'string' && json.error.length < 120) return json.error

  return 'Something went wrong. Please try again.'
}

// ─── SUPABASE CLIENT (for auth token only) ───────────────────────
let _supabase = null

function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('[api] Supabase env vars missing.')
    return null
  }
  _supabase = createClient(url, key)
  return _supabase
}

async function getToken() {
  try {
    const sb = getSupabase()
    if (!sb) return null
    const { data, error } = await sb.auth.getSession()
    if (error || !data?.session?.access_token) return null
    return data.session.access_token
  } catch (e) {
    console.error('[api] getToken failed:', e.message)
    return null
  }
}

// ─── CORE FETCH WRAPPER ──────────────────────────────────────────
// Returns { data, error } — never throws
// auth: true  → attaches Bearer token (admin endpoints)
// auth: false → no token (public endpoints)

async function apiFetch(path, { method = 'GET', body, auth = false } = {}) {
  if (!BASE) return { data: null, error: 'API base URL is not configured.' }

  const url = `${BASE}${path}`
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = await getToken()
    if (!token) {
      console.warn(`[api] ${method} ${path} — no token, redirecting to login`)
      return { data: null, error: '401' }   // caller handles redirect
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  console.log(`[api] ${method} ${url}`)

  try {
    const res = await fetch(url, options)
    let json = null

    try {
      json = await res.json()
    } catch {
      console.error(`[api] ${method} ${path} — response is not JSON (status ${res.status})`)
    }

    if (!res.ok) {
      const msg = resolveError(res.status, json)
      console.error(`[api] ${method} ${path} — ${res.status}:`, json)
      return { data: null, error: msg, status: res.status }
    }

    if (!json?.data && json?.data !== 0) {
      console.error(`[api] ${method} ${path} — missing data field:`, json)
      return { data: null, error: 'Unexpected response from server.' }
    }

    return { data: json.data, error: null }
  } catch (e) {
    console.error(`[api] ${method} ${path} — network error:`, e.message)
    return { data: null, error: ERROR_MAP.network }
  }
}

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────

// GET /rooms
export async function getRooms() {
  return apiFetch('/rooms')
}

// GET /rooms/categories
export async function getRoomCategories() {
  return apiFetch('/rooms/categories')
}

// GET /rooms/:id
export async function getRoom(id) {
  if (!id) return { data: null, error: 'Room ID is required.' }
  return apiFetch(`/rooms/${id}`)
}

// POST /bookings
export async function createBooking({ roomId, guestName, guestPhone, guestEmail, numNights }) {
  return apiFetch('/bookings', {
    method: 'POST',
    body: { roomId, guestName, guestPhone, guestEmail, numNights },
  })
}

// GET /payments/poll/:ref
export async function pollPayment(paymentRef) {
  if (!paymentRef) return { data: null, error: 'Payment reference is required.' }
  return apiFetch(`/payments/poll/${paymentRef}`)
}

// GET /bookings/ref/:ref
export async function getBookingByRef(ref) {
  if (!ref) return { data: null, error: 'Booking reference is required.' }
  return apiFetch(`/bookings/ref/${ref}`)
}

// GET /receipts/:bookingId
export async function getReceiptByBooking(bookingId) {
  if (!bookingId) return { data: null, error: 'Booking ID is required.' }
  return apiFetch(`/receipts/${bookingId}`)
}

// ─── ADMIN: BOOKINGS ─────────────────────────────────────────────

// GET /bookings?status=&roomId=
export async function getBookings({ status, roomId } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (roomId) params.set('roomId', roomId)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/bookings${qs}`, { auth: true })
}

// GET /bookings/:id
export async function getBooking(id) {
  if (!id) return { data: null, error: 'Booking ID is required.' }
  return apiFetch(`/bookings/${id}`, { auth: true })
}

// POST /bookings/:id/verify
export async function verifyBooking(id) {
  if (!id) return { data: null, error: 'Booking ID is required.' }
  return apiFetch(`/bookings/${id}/verify`, { method: 'POST', auth: true })
}

// POST /bookings/:id/checkout
export async function checkoutBooking(id) {
  if (!id) return { data: null, error: 'Booking ID is required.' }
  return apiFetch(`/bookings/${id}/checkout`, { method: 'POST', auth: true })
}

// PATCH /bookings/:id/cancel
export async function cancelBooking(id) {
  if (!id) return { data: null, error: 'Booking ID is required.' }
  return apiFetch(`/bookings/${id}/cancel`, { method: 'PATCH', auth: true })
}

// ─── ADMIN: ROOMS ────────────────────────────────────────────────

// GET /rooms (admin also uses public endpoint — no auth needed)
export { getRooms as adminGetRooms }

// PATCH /rooms/:id/status
export async function updateRoomStatus(id, status) {
  if (!id) return { data: null, error: 'Room ID is required.' }
  if (!status) return { data: null, error: 'Status is required.' }
  if (status === 'cleaning') {
    return { data: null, error: ERROR_MAP.CLEANING_AUTO_ONLY }
  }
  return apiFetch(`/rooms/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  })
}

// POST /rooms
export async function createRoom({ room_number, category_id, floor, notes, image_urls }) {
  return apiFetch('/rooms', {
    method: 'POST',
    body: { room_number, category_id, floor, notes, image_urls },
    auth: true,
  })
}

// PATCH /rooms/:id
export async function updateRoom(id, fields) {
  if (!id) return { data: null, error: 'Room ID is required.' }
  return apiFetch(`/rooms/${id}`, {
    method: 'PATCH',
    body: fields,
    auth: true,
  })
}

// DELETE /rooms/:id
export async function deleteRoom(id) {
  if (!id) return { data: null, error: 'Room ID is required.' }
  return apiFetch(`/rooms/${id}`, { method: 'DELETE', auth: true })
}

// ─── ADMIN: PAYMENTS ─────────────────────────────────────────────

// GET /payments
export async function getPayments() {
  return apiFetch('/payments', { auth: true })
}

// GET /payments/:id
export async function getPayment(id) {
  if (!id) return { data: null, error: 'Payment ID is required.' }
  return apiFetch(`/payments/${id}`, { auth: true })
}

// ─── ADMIN: RECEIPTS ─────────────────────────────────────────────

// GET /receipts
export async function getReceipts() {
  return apiFetch('/receipts', { auth: true })
}

// ─── ADMIN: DASHBOARD ────────────────────────────────────────────

// GET /admin/dashboard
export async function getDashboard() {
  return apiFetch('/admin/dashboard', { auth: true })
}

// ─── ADMIN: USERS ────────────────────────────────────────────────

// GET /admin/users
export async function getAdminUsers() {
  return apiFetch('/admin/users', { auth: true })
}

// POST /admin/users
export async function createAdminUser({ email, fullName, role }) {
  return apiFetch('/admin/users', {
    method: 'POST',
    body: { email, fullName, role },
    auth: true,
  })
}

// PATCH /admin/users/:id
export async function updateAdminUser(id, fields) {
  if (!id) return { data: null, error: 'User ID is required.' }
  return apiFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    body: fields,
    auth: true,
  })
}

// PATCH /admin/users/:id/deactivate
export async function deactivateAdminUser(id) {
  if (!id) return { data: null, error: 'User ID is required.' }
  return apiFetch(`/admin/users/${id}/deactivate`, {
    method: 'PATCH',
    auth: true,
  })
}

// ─── AUTH HELPERS (Supabase direct) ─────────────────────────────

// Sign in with email + password
export async function signIn(email, password) {
  try {
    const sb = getSupabase()
    if (!sb) return { data: null, error: 'Auth service unavailable.' }
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[api] signIn failed:', error.message)
      if (error.message?.toLowerCase().includes('invalid')) {
        return { data: null, error: 'Incorrect email or password.' }
      }
      return { data: null, error: 'Login failed. Please try again.' }
    }
    return { data: data.session, error: null }
  } catch (e) {
    console.error('[api] signIn error:', e.message)
    return { data: null, error: ERROR_MAP.network }
  }
}

// Sign out
export async function signOut() {
  try {
    const sb = getSupabase()
    if (!sb) return { error: null }
    await sb.auth.signOut()
    return { error: null }
  } catch (e) {
    console.error('[api] signOut error:', e.message)
    return { error: 'Sign out failed.' }
  }
}

// Get current session
export async function getSession() {
  try {
    const sb = getSupabase()
    if (!sb) return null
    const { data } = await sb.auth.getSession()
    return data?.session ?? null
  } catch (e) {
    console.error('[api] getSession error:', e.message)
    return null
  }
}
