'use client'

// app/admin/page.jsx
// Admin login. Email + password → Supabase Auth → redirect to dashboard.
// Validates inputs before any API call.
// Redirects away if already logged in.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signIn, getSession } from '@/lib/api'
import { validateLoginForm, sanitizeEmail, sanitizeString } from '@/lib/validate'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import GoldLine from '@/components/ui/GoldLine'
import Spinner from '@/components/ui/Spinner'

export default function AdminLoginPage() {
  const router = useRouter()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors]       = useState({})
  const [apiError, setApiError]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking]   = useState(true)

  // Redirect away if already logged in
  useEffect(() => {
    async function check() {
      const session = await getSession()
      if (session) {
        router.replace('/admin/dashboard')
      } else {
        setChecking(false)
      }
    }
    check()
  }, [router])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(e => ({ ...e, [name]: null }))
    setApiError(null)
  }

  async function handleSubmit() {
    setApiError(null)

    const sanitized = {
      email:    sanitizeEmail(form.email),
      password: sanitizeString(form.password),
    }

    // Validate before hitting API
    const { ok, errors: fieldErrors } = validateLoginForm(sanitized)
    if (!ok) {
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)

    const { data, error } = await signIn(sanitized.email, sanitized.password)

    if (error) {
      setApiError(error)
      setSubmitting(false)
      return
    }

    if (!data) {
      setApiError('Login failed. Please try again.')
      setSubmitting(false)
      return
    }

    // Success — session established, go to dashboard
    router.replace('/admin/dashboard')
  }

  // Handle Enter key
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !submitting) handleSubmit()
  }

  if (checking) return <Spinner fullPage />

  return (
    <main style={{
      minHeight: '100svh',
      background: '#0A0F1E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        {/* Brand */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.6rem', fontWeight: 600,
            color: '#C9A84C', letterSpacing: '0.3em',
            textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>
            Diamond Residence
          </p>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 800, letterSpacing: '-0.02em',
            color: '#F5F3EE',
          }}>
            Staff Login
          </h1>
        </div>

        <GoldLine />

        {/* Form */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          onKeyDown={handleKeyDown}
        >
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@diamond.com"
            error={errors.email}
            required
            disabled={submitting}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.password}
            required
            disabled={submitting}
          />

          {/* API error */}
          {apiError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: '0.8rem', fontWeight: 400,
                color: '#E05252', lineHeight: 1.5,
                padding: '0.75rem 1rem',
                border: '1px solid rgba(224,82,82,0.3)',
                background: 'rgba(224,82,82,0.05)',
              }}
            >
              {apiError}
            </motion.p>
          )}

          <Button
            onClick={handleSubmit}
            loading={submitting}
            fullWidth
          >
            Sign In
          </Button>
        </div>

        {/* Back to site */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <a
            href="/"
            style={{
              fontSize: '0.68rem', fontWeight: 400,
              color: 'rgba(245,243,238,0.25)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(245,243,238,0.5)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,243,238,0.25)'}
          >
            ← Diamond Residence
          </a>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
