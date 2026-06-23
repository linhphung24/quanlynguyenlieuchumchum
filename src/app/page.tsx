'use client'

import { useState, useEffect, useCallback } from 'react'
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
// import SummaryPage from '@/components/summary/SummaryPage'
import ProductsPage from '@/components/products/ProductsPage'
import AdminPage from '@/components/admin/AdminPage'
import UsersPage from '@/components/users/UsersPage'
import PersonnelPage from '@/components/personnel/PersonnelPage'
import UnitsPage from '@/components/units/UnitsPage'
import ReportsPage from '@/components/reports/ReportsPage'
import ChannelsPage from '@/components/channels/ChannelsPage'
import GroupsPage from '@/components/groups/GroupsPage'
import CustomersPage from '@/components/customers/CustomersPage'
import IntegrationsPage from '@/components/integrations/IntegrationsPage'
import { PageName } from '@/types'

export default function Home() {
  const { user, initialized, canAccess, allowedPages, toast } = useApp()
  const [currentPage, setCurrentPage] = useState<PageName>('products')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const VALID_PAGES: PageName[] = ['products', 'invoices', /*'summary',*/ 'recipes', 'calc', 'log', 'personnel', 'units', 'users', 'admin', 'reports', 'channels', 'groups', 'customers', 'integrations']

  // Nếu user không có quyền vào trang hiện tại → chuyển về trang đầu tiên được phép
  useEffect(() => {
    if (!user) return
    if (allowedPages.length === 0) return // chờ profile/quyền load xong
    if (!canAccess(currentPage)) {
      const fallback = allowedPages[0] ?? 'products'
      setCurrentPage(fallback)
      try { localStorage.setItem('cc_current_page', fallback) } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, allowedPages])

  // Khôi phục tab đã lưu khi load lại trang
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_current_page') as PageName | null
      if (saved && VALID_PAGES.includes(saved)) setCurrentPage(saved)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Xử lý redirect quay về từ OAuth Facebook (?tab=integrations&fb=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') as PageName | null
      const fb  = params.get('fb')
      if (tab && VALID_PAGES.includes(tab)) {
        setCurrentPage(tab)
        try { localStorage.setItem('cc_current_page', tab) } catch {}
      }
      if (fb) {
        if (fb === 'connected') {
          toast(`Đã kết nối ${params.get('count') ?? ''} Page Facebook 🎉`.trim(), 'success')
        } else if (fb === 'denied') {
          toast('Bạn đã huỷ kết nối Facebook', 'error')
        } else if (fb === 'nopages') {
          toast('Tài khoản này chưa quản lý Page nào', 'error')
        } else if (fb === 'error') {
          toast('Kết nối Facebook lỗi: ' + (params.get('msg') ?? ''), 'error')
        }
      }
      if (tab || fb) {
        // Dọn query khỏi URL cho gọn
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lưu tab mỗi khi chuyển trang
  const handlePageChange = useCallback((page: PageName) => {
    setCurrentPage(page)
    try { localStorage.setItem('cc_current_page', page) } catch {}
  }, [])

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
        <div className="min-h-screen flex bg-[#f2ece3]">

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex" onClick={() => setSidebarOpen(false)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative w-64 h-full flex-shrink-0" onClick={e => e.stopPropagation()}>
                <Nav current={currentPage} onChange={p => { handlePageChange(p); setSidebarOpen(false) }} />
              </div>
            </div>
          )}

          {/* Desktop sidebar */}
          <div className="hidden md:flex md:flex-shrink-0">
            <Nav current={currentPage} onChange={handlePageChange} />
          </div>

          {/* Main column */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header currentPage={currentPage} onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              {currentPage === 'products'  && <ProductsPage />}
              {currentPage === 'invoices'  && <InvoicesPage />}
              {/* {currentPage === 'summary'   && <SummaryPage />} */}
              {currentPage === 'recipes'   && <RecipesPage />}
              {currentPage === 'calc'      && <CalcPage />}
              {currentPage === 'log'       && <LogPage />}
              {currentPage === 'personnel' && <PersonnelPage />}
              {currentPage === 'units'     && <UnitsPage />}
              {currentPage === 'users'     && <UsersPage />}
              {currentPage === 'admin'     && <AdminPage />}
              {currentPage === 'reports'   && <ReportsPage />}
              {currentPage === 'channels'  && <ChannelsPage />}
              {currentPage === 'groups'    && <GroupsPage />}
              {currentPage === 'customers' && <CustomersPage />}
              {currentPage === 'integrations' && <IntegrationsPage />}
            </main>
          </div>

        </div>
      )}
    </>
  )
}
