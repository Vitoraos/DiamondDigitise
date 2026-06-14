// lib/validate.js
// Every user input is treated as an attack.
// All validators return { ok: boolean, error: string | null }

// ─── PRIMITIVES ──────────────────────────────────────────────────

const ok = () => ({ ok: true, error: null })
const fail = (msg) => ({ ok: false, error: msg })

function isDefined(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

// ─── SANITIZERS ──────────────────────────────────────────────────

export function sanitizeString(v) {
  if (typeof v !== 'string') return ''
  return v.trim().replace(/[<>]/g, '')         // strip < > to kill script injection
}

export function sanitizeEmail(v) {
  if (typeof v !== 'string') return ''
  return v.trim().toLowerCase().replace(/[<>]/g, '')
}

// ─── VALIDATORS ──────────────────────────────────────────────────

export function validateName(v) {
  if (!isDefined(v)) return fail('Name is required.')
  const s = sanitizeString(v)
  if (s.length < 2) return fail('Name must be at least 2 characters.')
  if (s.length > 80) return fail('Name must be under 80 characters.')
  if (!/^[a-zA-Z\s'\-\.]+$/.test(s)) return fail('Name contains invalid characters.')
  return ok()
}

export function validatePhone(v) {
  if (!isDefined(v)) return fail('Phone number is required.')
  const s = sanitizeString(v).replace(/\s/g, '')
  if (!/^0[789][01]\d{8}$/.test(s)) return fail('Enter a valid Nigerian phone number (e.g. 08012345678).')
  return ok()
}

export function validateEmail(v) {
  if (!isDefined(v)) return fail('Email is required.')
  const s = sanitizeEmail(v)
  if (s.length > 254) return fail('Email is too long.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return fail('Enter a valid email address.')
  return ok()
}

export function validateNumNights(v) {
  const n = Number(v)
  if (!isDefined(v)) return fail('Number of nights is required.')
  if (!Number.isInteger(n)) return fail('Nights must be a whole number.')
  if (n < 1) return fail('Minimum stay is 1 night.')
  if (n > 30) return fail('Maximum stay is 30 nights.')
  return ok()
}

export function validateRoomNumber(v) {
  if (!isDefined(v)) return fail('Room number is required.')
  const s = sanitizeString(v)
  if (s.length < 1) return fail('Room number is required.')
  if (s.length > 10) return fail('Room number must be under 10 characters.')
  if (!/^[a-zA-Z0-9\-]+$/.test(s)) return fail('Room number can only contain letters, numbers, and hyphens.')
  return ok()
}

export function validateFloor(v) {
  const n = Number(v)
  if (!isDefined(v)) return fail('Floor is required.')
  if (!Number.isInteger(n)) return fail('Floor must be a whole number.')
  if (n < 1) return fail('Floor must be at least 1.')
  if (n > 20) return fail('Floor must be 20 or below.')
  return ok()
}

export function validatePrice(v) {
  const n = Number(v)
  if (!isDefined(v)) return fail('Price is required.')
  if (isNaN(n)) return fail('Price must be a number.')
  if (n <= 0) return fail('Price must be greater than 0.')
  if (n > 10_000_000) return fail('Price exceeds maximum allowed value.')
  return ok()
}

export function validateRole(v) {
  const allowed = ['manager', 'front_desk']
  if (!isDefined(v)) return fail('Role is required.')
  if (!allowed.includes(v)) return fail('Invalid role selected.')
  return ok()
}

export function validatePassword(v) {
  if (!isDefined(v)) return fail('Password is required.')
  if (v.length < 6) return fail('Password must be at least 6 characters.')
  if (v.length > 128) return fail('Password is too long.')
  return ok()
}

export function validateUUID(v, label = 'ID') {
  if (!isDefined(v)) return fail(`${label} is missing.`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)) {
    return fail(`Invalid ${label}.`)
  }
  return ok()
}

export function validateCategoryId(v) {
  return validateUUID(v, 'Category')
}

export function validateRoomId(v) {
  return validateUUID(v, 'Room')
}

export function validateBookingId(v) {
  return validateUUID(v, 'Booking')
}

export function validateDescription(v) {
  if (!isDefined(v)) return ok()                // optional field
  const s = sanitizeString(v)
  if (s.length > 500) return fail('Description must be under 500 characters.')
  return ok()
}

// ─── FORM-LEVEL VALIDATORS ───────────────────────────────────────
// Run all fields at once, return { ok, errors: { field: message } }

export function validateBookingForm({ guestName, guestPhone, guestEmail, numNights }) {
  const errors = {}

  const name = validateName(guestName)
  if (!name.ok) errors.guestName = name.error

  const phone = validatePhone(guestPhone)
  if (!phone.ok) errors.guestPhone = phone.error

  const email = validateEmail(guestEmail)
  if (!email.ok) errors.guestEmail = email.error

  const nights = validateNumNights(numNights)
  if (!nights.ok) errors.numNights = nights.error

  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateRoomForm({ room_number, floor, category_id, price_per_night, description }) {
  const errors = {}

  const num = validateRoomNumber(room_number)
  if (!num.ok) errors.room_number = num.error

  const fl = validateFloor(floor)
  if (!fl.ok) errors.floor = fl.error

  const cat = validateCategoryId(category_id)
  if (!cat.ok) errors.category_id = cat.error

  const price = validatePrice(price_per_night)
  if (!price.ok) errors.price_per_night = price.error

  const desc = validateDescription(description)
  if (!desc.ok) errors.description = desc.error

  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateLoginForm({ email, password }) {
  const errors = {}

  const e = validateEmail(email)
  if (!e.ok) errors.email = e.error

  const p = validatePassword(password)
  if (!p.ok) errors.password = p.error

  return { ok: Object.keys(errors).length === 0, errors }
}

export function validateCreateUserForm({ name, email, password, role }) {
  const errors = {}

  const n = validateName(name)
  if (!n.ok) errors.name = n.error

  const e = validateEmail(email)
  if (!e.ok) errors.email = e.error

  const p = validatePassword(password)
  if (!p.ok) errors.password = p.error

  const r = validateRole(role)
  if (!r.ok) errors.role = r.error

  return { ok: Object.keys(errors).length === 0, errors }
}
