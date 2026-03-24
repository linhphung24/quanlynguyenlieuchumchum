'use client'

import { useState, useEffect } from 'react'

interface DateInputProps {
  value: string          // ISO yyyy-mm-dd
  onChange: (v: string) => void
  className?: string
  placeholder?: string
}

function toDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function toISO(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

export default function DateInput({ value, onChange, className, placeholder = 'dd/mm/yyyy' }: DateInputProps) {
  const [text, setText] = useState(() => toDisplay(value))

  useEffect(() => {
    setText(toDisplay(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits, auto-insert slashes
    let digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let v = digits
    if (digits.length > 2) v = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) v = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setText(v)
    const iso = toISO(v)
    if (iso) onChange(iso)
    if (!v) onChange('')
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      maxLength={10}
      onChange={handleChange}
      className={className}
    />
  )
}
