'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { Profile, Recipe, Product, Toast, UserGroup, PageName } from '@/types'
import { UNITS, defaultPagesForRole } from '@/lib/constants'

interface AppContextValue {
  sb: SupabaseClient
  user: User | null
  profile: Profile | null
  allProfiles: Profile[]
  setAllProfiles: React.Dispatch<React.SetStateAction<Profile[]>>
  recipes: Recipe[]
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>
  currentRecipeId: number | null
  setCurrentRecipeId: React.Dispatch<React.SetStateAction<number | null>>
  allProducts: Product[]
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>
  allUnits: string[]
  setAllUnits: React.Dispatch<React.SetStateAction<string[]>>
  userGroup: UserGroup | null
  canAccess: (page: PageName) => boolean
  allowedPages: PageName[]
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
  // Ref luôn giữ giá trị user/profile mới nhất — để writeAudit (gọi trong closure cũ
  // của onAuthStateChange) đọc đúng, không bị stale và không cần sb.auth.getUser() qua mạng
  const userRef = useRef<User | null>(null)
  const profileRef = useRef<Profile | null>(null)
  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { profileRef.current = profile }, [profile])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentRecipeId, setCurrentRecipeId] = useState<number | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allUnits, setAllUnits]       = useState<string[]>(UNITS)
  const [userGroup, setUserGroup]     = useState<UserGroup | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [loadingCount, setLoadingCount] = useState(0)
  const loading = loadingCount > 0
  const [initialized, setInitialized] = useState(false)

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const startLoading = useCallback(() => setLoadingCount(c => c + 1), [])
  const stopLoading  = useCallback(() => setLoadingCount(c => Math.max(0, c - 1)), [])

  const loadAppData = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await sb.from('profiles').select('*').eq('id', userId).single()
      if (profileData) {
        const prof = profileData as unknown as Profile
        setProfile(prof)
        // Tải nhóm của user (nếu có) để tính quyền truy cập tab
        if (prof.group_id) {
          try {
            const { data: groupData } = await sb.from('user_groups').select('*').eq('id', prof.group_id).single()
            setUserGroup((groupData as unknown as UserGroup) ?? null)
          } catch { setUserGroup(null) }
        } else {
          setUserGroup(null)
        }
      }
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

    try {
      const { data: unitsData } = await sb.from('units').select('name').order('sort_order').order('name')
      if (unitsData && unitsData.length > 0)
        setAllUnits((unitsData as { name: string }[]).map(u => u.name))
    } catch {}
  }, [sb])

  const clearState = useCallback(() => {
    setUser(null)
    setProfile(null)
    setAllProfiles([])
    setRecipes([])
    setCurrentRecipeId(null)
    setAllProducts([])
    setAllUnits(UNITS)
    setUserGroup(null)
  }, [])

  const writeAudit = useCallback(async (
    action: string,
    entity: string,
    entityId?: string | null,
    detail?: string | null
  ) => {
    try {
      // Đọc từ ref — KHÔNG gọi sb.auth.getUser() qua mạng
      // (getUser có thể treo do auth-lock khi mở nhiều tab → kẹt mọi handler có await writeAudit)
      const u = userRef.current
      if (!u) return
      await (sb as any).from('audit_log').insert({
        user_id: u.id,
        user_name: profileRef.current?.full_name ?? '',
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
        userRef.current = session.user   // set ngay để writeAudit('login') có user
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

  // ── Phân quyền truy cập tab ─────────────────────────────────
  // 'admin' & 'groups' luôn chỉ dành cho role admin (chống leo thang quyền).
  // Có nhóm → dùng allowed_pages của nhóm. Chưa có nhóm → quyền mặc định theo role.
  const ADMIN_ONLY: PageName[] = ['admin', 'groups', 'integrations']
  const canAccess = useCallback((page: PageName): boolean => {
    if (!profile) return false
    if (profile.role === 'admin') return true
    if (ADMIN_ONLY.includes(page)) return false
    if (userGroup) return userGroup.allowed_pages.includes(page)
    return defaultPagesForRole(profile.role).includes(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userGroup])

  const allowedPages: PageName[] = (() => {
    if (!profile) return []
    if (profile.role === 'admin') {
      return ['products','invoices','reports','recipes','calc','log','customers','channels','integrations','personnel','units','users','admin','groups']
    }
    const pages = userGroup ? (userGroup.allowed_pages as PageName[]) : defaultPagesForRole(profile.role)
    return pages.filter(p => !ADMIN_ONLY.includes(p))
  })()

  const value: AppContextValue = {
    sb, user, profile, allProfiles, setAllProfiles,
    recipes, setRecipes, currentRecipeId, setCurrentRecipeId,
    allProducts, setAllProducts,
    allUnits, setAllUnits,
    userGroup, canAccess, allowedPages,
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
