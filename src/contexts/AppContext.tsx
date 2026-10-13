'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { User, RolePermission, PageName, Toast, AppModule } from '@/types';

interface PermissionEntry {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface AppContextValue {
  user: User | null;
  permissions: Record<string, PermissionEntry>;
  hasPermission: (
    featureKey: string,
    action?: 'view' | 'create' | 'edit' | 'delete'
  ) => boolean;
  canAccess: (page: PageName) => boolean;
  activePage: PageName;
  setActivePage: (page: PageName) => void;
  currentModule: AppModule;
  setCurrentModule: (mod: AppModule) => void;
  canSwitchModule: boolean;
  toasts: Toast[];
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  loading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initialized: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const PAGE_FEATURE_MAP: Record<PageName, string> = {
  'accounting-dashboard': 'Menu_Vouchers_Chi',
  invoices: 'Menu_Invoices_Import',
  batches: 'Menu_Batches',
  vouchers: 'Menu_Vouchers_Chi',
  'cash-report': 'Menu_Vouchers_Chi',
  debts: 'Menu_Vouchers_Chi',
  'stock-opening': 'Menu_StockOpening',
  reports: 'Menu_SummaryReport',
  products: 'Menu_Products',
  recipes: 'Menu_Recipes',
  calc: 'Menu_Recipes',
  suppliers: 'Menu_Suppliers',
  'company-info': 'Menu_Products',
  users: 'Menu_Users',
  permissions: 'Menu_RolePermissions',
  'audit-log': 'Menu_Users',
  'pos-tables': 'Menu_Products',
  'pos-menu': 'Menu_Products',
  'pos-receipt-template': 'Menu_Products',
  'pos-payment-settings': 'Menu_Products',
  'pos-shifts': 'Menu_Products',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, PermissionEntry>>({});
  const [activePage, setActivePage] = useState<PageName>('invoices');
  const [currentModule, setCurrentModuleState] = useState<AppModule>('warehouse');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const canSwitchModule = useMemo(() => {
    if (!user) return false;
    return user.Role === 'admin' || user.Role === 'manager' || user.Role === 'staff';
  }, [user]);

  const setCurrentModule = useCallback((mod: AppModule) => {
    setCurrentModuleState(mod);
    try {
      localStorage.setItem('chumchum_module', mod);
    } catch {}
    if (mod === 'warehouse') {
      setActivePage((prev) =>
        prev.startsWith('pos-') || prev === 'vouchers' || prev === 'debts' || prev === 'accounting-dashboard'
          ? 'invoices'
          : prev
      );
    } else if (mod === 'accounting') {
      setActivePage((prev) =>
        prev.startsWith('pos-') || prev === 'calc' || prev === 'batches' || prev === 'invoices'
          ? 'accounting-dashboard'
          : prev
      );
    } else if (mod === 'pos') {
      setActivePage('pos-tables');
    }
  }, []);

  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const startLoading = useCallback(() => setLoadingCount((c) => c + 1), []);
  const stopLoading = useCallback(() => setLoadingCount((c) => Math.max(0, c - 1)), []);

  const loadPermissions = useCallback(async (role: string) => {
    try {
      const res = await fetch(`/api/auth/me?role=${encodeURIComponent(role)}`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || {});
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  }, []);

  const initModuleForUser = useCallback((userRole: string) => {
    let mod: AppModule = 'warehouse';
    if (userRole === 'thukho') {
      mod = 'warehouse';
    } else if (userRole === 'ketoan' || userRole === 'accountant') {
      mod = 'accounting';
      setActivePage('accounting-dashboard');
    } else if (userRole === 'staff') {
      mod = 'pos';
      setActivePage('pos-tables');
    } else {
      try {
        const savedMod = localStorage.getItem('chumchum_module');
        if (savedMod === 'accounting' || savedMod === 'warehouse' || savedMod === 'pos') {
          mod = savedMod;
          if (savedMod === 'pos') setActivePage('pos-tables');
        }
      } catch {}
    }
    setCurrentModuleState(mod);
  }, []);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chumchum_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user) {
          setUser(parsed.user);
          initModuleForUser(parsed.user.Role);
          if (parsed.permissions) {
            setPermissions(parsed.permissions);
          } else {
            loadPermissions(parsed.user.Role);
          }
        }
      }
    } catch {}
    setInitialized(true);
  }, [loadPermissions, initModuleForUser]);

  const login = useCallback(
    async (username: string, pass: string) => {
      startLoading();
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: pass }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Đăng nhập không thành công.' };
        }

        setUser(data.user);
        initModuleForUser(data.user.Role);
        setPermissions(data.permissions || {});
        localStorage.setItem(
          'chumchum_session',
          JSON.stringify({ user: data.user, permissions: data.permissions })
        );
        toast(`Xin chào, ${data.user.FullName || data.user.Username}!`, 'success');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Lỗi kết nối máy chủ.' };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading, toast, initModuleForUser]
  );

  const logout = useCallback(() => {
    setUser(null);
    setPermissions({});
    localStorage.removeItem('chumchum_session');
    toast('Đã đăng xuất.', 'info');
  }, [toast]);

  const hasPermission = useCallback(
    (featureKey: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
      if (!user) return false;
      if (user.Role === 'admin') return true;

      const perm = permissions[featureKey];
      if (!perm) return false;

      switch (action) {
        case 'view':
          return perm.canView;
        case 'create':
          return perm.canCreate;
        case 'edit':
          return perm.canEdit;
        case 'delete':
          return perm.canDelete;
        default:
          return false;
      }
    },
    [user, permissions]
  );

  const canAccess = useCallback(
    (page: PageName): boolean => {
      if (!user) return false;
      if (user.Role === 'admin') return true;
      const fKey = PAGE_FEATURE_MAP[page];
      if (!fKey) return true;
      return hasPermission(fKey, 'view');
    },
    [user, hasPermission]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        canAccess,
        activePage,
        setActivePage,
        currentModule,
        setCurrentModule,
        canSwitchModule,
        toasts,
        toast,
        loading: loadingCount > 0,
        startLoading,
        stopLoading,
        login,
        logout,
        initialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
