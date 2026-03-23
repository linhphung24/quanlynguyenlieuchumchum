'use client'

import { useApp } from '@/contexts/AppContext'

export default function Toast() {
  const { toasts } = useApp()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            animate-toastIn pointer-events-auto
            flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[220px] max-w-xs
            ${t.type === 'success' ? 'bg-[#d4f5e3] text-[#1e7a4a] border border-[#a8e6c3]' : ''}
            ${t.type === 'error' ? 'bg-[#fde8e5] text-[#c0392b] border border-[#f5c6c0]' : ''}
            ${t.type === 'info' ? 'bg-[#ddeaf8] text-[#2563a8] border border-[#b3d0f0]' : ''}
          `}
        >
          <span>
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'info' && 'ℹ'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
