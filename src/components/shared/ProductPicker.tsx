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
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  // Đóng dropdown khi scroll trang (tránh dropdown trôi sai vị trí)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  const active = products.filter((p) => p.is_active)
  const filtered = query
    ? active.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
    : active.slice(0, 40)

  // Tính vị trí fixed — thoát khỏi mọi overflow:hidden/auto
  const calcPos = () => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
  }

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    calcPos()
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
    calcPos()
    if (!open) setOpen(true)
    onChange(val, '')
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors font-sans"
          autoComplete="off"
        />
      </div>

      {/* Dropdown render ở ngoài DOM thường, dùng fixed để thoát overflow */}
      {open && dropPos && (
        <div
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
          }}
          className="bg-white border border-[#f5e6cc] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-52 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-[#8b5e3c] italic">Không tìm thấy sản phẩm</div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer hover:bg-[#fef4e8] text-[#3d1f0a] border-b border-[#f5e6cc] last:border-0"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-[#8b5e3c] ml-2 flex-shrink-0">{p.unit}</span>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
