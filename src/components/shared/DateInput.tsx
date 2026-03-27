'use client'

import { useState, useEffect, useRef } from 'react'

interface DateInputProps {
  value: string          // ISO yyyy-mm-dd
  onChange: (v: string) => void
  className?: string
  placeholder?: string
}

function toDisplay(iso: string) {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return ''
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function toISO(display: string): string | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

export default function DateInput({ value, onChange, className, placeholder = 'dd/mm/yyyy' }: DateInputProps) {
  const [text, setText] = useState(() => toDisplay(value))
  const pickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setText(toDisplay(value)) }, [value])

  // Gõ tay dd/mm/yyyy — tự chèn dấu /
  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let v = digits
    if (digits.length > 2) v = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) v = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setText(v)
    const iso = toISO(v)
    if (iso) onChange(iso)
    if (!v) onChange('')
  }

  // Chọn từ calendar
  const handlePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) onChange(e.target.value)
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        maxLength={10}
        onChange={handleText}
        className={className}
        style={{ paddingRight: '28px' }}
      />
      {/* Nút 📅 — click mở native date picker */}
      <span
        className="absolute right-2 inset-y-0 flex items-center text-[#c8773a] cursor-pointer select-none text-sm"
        title="Chọn ngày"
      >
        📅
        <input
          ref={pickerRef}
          type="date"
          value={value || ''}
          onChange={handlePicker}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          tabIndex={-1}
        />
      </span>
    </div>
  )
}
