'use client'

import { useRef, useState } from 'react'

interface TextPickerProps {
  value: string
  onChange: (v: string) => void
  suggestions: string[]   // danh sách gợi ý
  placeholder?: string
  className?: string
}

export default function TextPicker({ value, onChange, suggestions, placeholder = '', className = '' }: TextPickerProps) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 20)
    : suggestions.slice(0, 20)

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setOpen(true)
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      setOpen(false)
      onChange(value.trim())
    }, 160)
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#f5e6cc] rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#fef4e8] text-[#3d1f0a]"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
