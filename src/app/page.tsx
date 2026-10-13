'use client';

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import AuthScreen from '@/components/auth/AuthScreen';
import Nav from '@/components/layout/Nav';
import Header from '@/components/layout/Header';
import Toast from '@/components/shared/Toast';

import InvoicesPage from '@/components/invoices/InvoicesPage';
import BatchesPage from '@/components/batches/BatchesPage';
import CashVouchersPage from '@/components/vouchers/CashVouchersPage';
import CashReportPage from '@/components/vouchers/CashReportPage';
import DebtsPage from '@/components/debts/DebtsPage';
import StockOpeningPage from '@/components/stock-opening/StockOpeningPage';
import SummaryPage from '@/components/summary/SummaryPage';
import ProductsPage from '@/components/products/ProductsPage';
import RecipesPage from '@/components/recipes/RecipesPage';
import RecipeCalcPage from '@/components/calc/RecipeCalcPage';
import SuppliersPage from '@/components/suppliers/SuppliersPage';
import CompanyInfoPage from '@/components/company/CompanyInfoPage';
import UsersPage from '@/components/users/UsersPage';
import RolePermissionsPage from '@/components/permissions/RolePermissionsPage';
import AuditLogPage from '@/components/audit/AuditLogPage';
import AccountingDashboardPage from '@/components/dashboard/AccountingDashboardPage';
import PosTablesPage from '@/components/pos/PosTablesPage';
import PosReceiptTemplatePage from '@/components/pos/PosReceiptTemplatePage';
import PosPaymentSettingsPage from '@/components/pos/PosPaymentSettingsPage';
import PosShiftsPage from '@/components/pos/PosShiftsPage';
import PosMenuPage from '@/components/pos/PosMenuPage';

export default function Home() {
  const { user, initialized, activePage } = useApp();

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-600 rounded-full animate-spin" />
          <span>Đang khởi tạo hệ thống Chum Chum Bakery...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'accounting-dashboard':
        return <AccountingDashboardPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'batches':
        return <BatchesPage />;
      case 'vouchers':
        return <CashVouchersPage />;
      case 'cash-report':
        return <CashReportPage />;
      case 'debts':
        return <DebtsPage />;
      case 'stock-opening':
        return <StockOpeningPage />;
      case 'reports':
        return <SummaryPage />;
      case 'products':
        return <ProductsPage />;
      case 'recipes':
        return <RecipesPage />;
      case 'calc':
        return <RecipeCalcPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'company-info':
        return <CompanyInfoPage />;
      case 'users':
        return <UsersPage />;
      case 'permissions':
        return <RolePermissionsPage />;
      case 'audit-log':
        return <AuditLogPage />;
      case 'pos-tables':
        return <PosTablesPage />;
      case 'pos-menu':
        return <PosMenuPage />;
      case 'pos-receipt-template':
        return <PosReceiptTemplatePage />;
      case 'pos-payment-settings':
        return <PosPaymentSettingsPage />;
      case 'pos-shifts':
        return <PosShiftsPage />;
      default:
        return <PosTablesPage />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar Navigation */}
      <Nav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:h-auto print:overflow-visible">
        <Header />
        <main className="flex-1 overflow-hidden relative bg-slate-50 print:block print:h-auto print:overflow-visible print:bg-white">
          {renderActivePage()}
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="print:hidden no-print">
        <Toast />
      </div>
    </div>
  );
}
