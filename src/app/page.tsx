'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import AuthScreen from '@/components/auth/AuthScreen'
import Header from '@/components/layout/Header'
import Nav from '@/components/layout/Nav'
import Toast from '@/components/shared/Toast'
import LoadingBar from '@/components/shared/LoadingBar'
import RecipesPage from '@/components/recipes/RecipesPage'
import CalcPage from '@/components/calc/CalcPage'
import LogPage from '@/components/log/LogPage'
import InvoicesPage from '@/components/invoices/InvoicesPage'
import SummaryPage from '@/components/summary/SummaryPage'
import ProductsPage from '@/components/products/ProductsPage'
import AdminPage from '@/components/admin/AdminPage'
import { PageName } from '@/types'

export default function Home() {
  const { user, initialized } = useApp()
  const [currentPage, setCurrentPage] = useState<PageName>('recipes')

  // Đang kiểm tra session — tránh flash màn hình
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#fdf6ec] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-float">🥐</div>
          <div className="text-sm text-[#8b5e3c]">Đang tải...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingBar />
      <Toast />
      {!user ? (
        <AuthScreen />
      ) : (
        <div className="min-h-screen flex flex-col">
          <Header />
          <Nav current={currentPage} onChange={setCurrentPage} />
          <main className="flex-1">
            {currentPage === 'recipes' && <RecipesPage />}
            {currentPage === 'calc' && <CalcPage />}
            {currentPage === 'log' && <LogPage />}
            {currentPage === 'invoices' && <InvoicesPage />}
            {currentPage === 'summary' && <SummaryPage />}
            {currentPage === 'products' && <ProductsPage />}
            {currentPage === 'admin' && <AdminPage />}
          </main>
        </div>
      )}
    </>
  )
}
