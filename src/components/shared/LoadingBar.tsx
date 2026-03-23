'use client'

import { useApp } from '@/contexts/AppContext'

export default function LoadingBar() {
  const { loading } = useApp()
  if (!loading) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-[#f5e6cc]">
      <div className="h-full bg-gradient-to-r from-[#c8773a] to-[#e8a44a] animate-pulse w-full" />
    </div>
  )
}
