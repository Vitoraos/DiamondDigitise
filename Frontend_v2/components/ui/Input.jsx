'use client'

// components/ui/Input.jsx
// Handles text, email, tel, number, password, select, textarea
// Shows label, error message, defensive against XSS in display

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  options,        // for type="select": [{ value, label }]
  rows = 4,       // for type="textarea"
  min,
  max,
}) {
  const baseStyle = {
    background: '#111827',
    border: `1px solid ${error ? '#E05252' : 'rgba(245,243,238,0.12)'}`,
    color: '#F5F3EE',
    padding: '0.85rem 1rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 400,
    width: '100%',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'auto',
  }

  function handleChange(e) {
    if (disabled) return
    onChange?.(e)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: '0.65rem',
            fontWeight: 500,
            color: '#C9A84C',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {label}{required && <span style={{ color: '#E05252', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{ ...baseStyle, appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <option value="">Select…</option>
          {Array.isArray(options) && options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          style={{ ...baseStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
          style={baseStyle}
        />
      )}

      {error && (
        <p style={{
          fontSize: '0.72rem',
          color: '#E05252',
          fontWeight: 400,
          lineHeight: 1.4,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
