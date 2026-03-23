'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { Profile, Recipe, Product, Toast } from '@/types'

interface AppContextValue {
  sb: SupabaseClient
  user: User | null
  profile: Profile | null
  allProfiles: Profile[]
  recipes: Recipe[]
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>
  currentRecipeId: number | null
  setCurrentRecipeId: React.Dispatch<React.SetStateAction<number | null>>
  allProducts: Product[]
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>
  toasts: Toast[]
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
  loading: boolean
  startLoading: () => void
  stopLoading: () => void
  writeAudit: (action: string, entity: string, entityId?: string | null, detail?: string | null) => Promise<void>
  logout: () => void
  initialized: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const sbRef = useRef(createClient())
  const sb = sbRef.current

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentRecipeId, setCurrentRecipeId] = useState<number | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const startLoading = useCallback(() => setLoading(true), [])
  const stopLoading = useCallback(() => setLoading(false), [])

  const loadAppData = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await sb.from('profiles').select('*').eq('id', userId).single()
      if (profileData) setProfile(profileData as unknown as Profile)
    } catch {}

    try {
      const { data: recipesData } = await sb.from('recipes').select('*').order('id')
      if (recipesData) {
        const mapped = recipesData as unknown as Recipe[]
        setRecipes(mapped)
        setCurrentRecipeId((prev) => prev ?? (mapped[0]?.id ?? null))
      }
    } catch {}

    try {
      const { data: productsData } = await sb.from('products').select('*').order('name')
      if (productsData) setAllProducts(productsData as unknown as Product[])
    } catch {}

    try {
      const { data: profilesData } = await sb.from('profiles').select('*').order('created_at')
      if (profilesData) setAllProfiles(profilesData as unknown as Profile[])
    } catch {}
  }, [sb])

  const clearState = useCallback(() => {
    setUser(null)
    setProfile(null)
    setAllProfiles([])
    setRecipes([])
    setCurrentRecipeId(null)
    setAllProducts([])
  }, [])

  const writeAudit = useCallback(async (
    action: string,
    entity: string,
    entityId?: string | null,
    detail?: string | null
  ) => {
    try {
      const { data: { user: u } } = await sb.auth.getUser()
      if (!u) return
      const { data: prof } = await (sb as any).from('profiles').select('full_name').eq('id', u.id).single()
      await (sb as any).from('audit_log').insert({
        user_id: u.id,
        user_name: prof?.full_name ?? '',
        action, entity,
        entity_id: entityId ?? null,
        detail: detail ?? null,
      })
    } catch { /* silent */ }
  }, [sb])

  const logout = useCallback(() => {
    // Xóa toàn bộ session trong localStorage ngay lập tức (không await)
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('sb-')) localStorage.removeItem(k)
      })
    } catch {}
    // Gọi signOut không await — kệ nó chạy background
    sb.auth.signOut().catch(() => {})
    // Reload ngay để về màn login
    window.location.reload()
  }, [sb])

  useEffect(() => {
    let mounted = true
    // Dùng flag để SIGNED_IN event không re-load khi mới vào trang (đã load qua getSession rồi)
    let initCompleted = false

    const init = async () => {
      const timer = setTimeout(() => {
        if (mounted) { initCompleted = true; setInitialized(true) }
      }, 4000)
      try {
        const { data: { session } } = await sb.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          await loadAppData(session.user.id)
        }
      } catch (e) {
        console.error('[Auth init]', e)
      } finally {
        clearTimeout(timer)
        initCompleted = true
        if (mounted) setInitialized(true)
      }
    }

    init()

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_IN' && session?.user) {
        // Bỏ qua SIGNED_IN đầu tiên nếu init() chưa xong (tránh double-load)
        if (!initCompleted) return
        setUser(session.user)
        await loadAppData(session.user.id)
        try { await writeAudit('login', 'auth', null, 'Đăng nhập thành công') } catch {}
      } else if (event === 'SIGNED_OUT') {
        clearState()
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: AppContextValue = {
    sb, user, profile, allProfiles,
    recipes, setRecipes, currentRecipeId, setCurrentRecipeId,
    allProducts, setAllProducts,
    toasts, toast, loading, startLoading, stopLoading,
    writeAudit, logout, initialized,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
