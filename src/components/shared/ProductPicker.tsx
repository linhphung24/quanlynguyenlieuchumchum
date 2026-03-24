'use client'

import { useState, useRef, useEffect } from 'react'
import { Product } from '@/types'

interface ProductPickerProps {
  products: Product[]
  value: string
  onChange: (name: string, unit: string) => void
  placeholder?: string
  className?: string
}

export default function ProductPicker({
  products,
  value,
  onChange,
  placeholder = '🔍 Tìm sản phẩm...',
  className = '',
}: ProductPickerProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const active = products.filter((p) => p.is_active)
  const filtered = query
    ? active.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)
    : active.slice(0, 40)

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setOpen(true)
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 160)
  }

  const handleSelect = (p: Product) => {
    setQuery(p.name)
    onChange(p.name, p.unit)
    setOpen(false)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (!open) setOpen(true)
    // Luôn đồng bộ tên về parent khi gõ tay (unit để trống nếu không chọn từ dropdown)
    onChange(val, '')
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors font-sans"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#f5e6cc] rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#8b5e3c] italic">Không tìm thấy sản phẩm</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-[#fef4e8] text-[#3d1f0a]"
              >
                <span>{p.name}</span>
                <span className="text-xs text-[#8b5e3c] ml-2">{p.unit}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
