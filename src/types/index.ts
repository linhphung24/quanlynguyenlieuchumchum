export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'manager' | 'staff'
  created_at: string
}

export interface RecipeIngredient {
  name: string
  amount: number
  unit: string
}

export interface Recipe {
  id: number
  name: string
  base_yield: number
  ingredients: RecipeIngredient[]
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string | null
}

export interface DailyLog {
  id: number
  log_date: string
  recipe_id: number
  qty: number
  created_by: string
  updated_by: string | null
  created_at: string
}

export interface InvoiceItemIn {
  name: string
  amount: number
  unit: string
  price?: number
  mfg_date?: string
  exp_date?: string
}

export interface InvoiceItemOut {
  recipeId?: number
  recipe_id?: number
  qty: number
  price?: number
}

export type InvoiceItem = InvoiceItemIn | InvoiceItemOut

export interface Invoice {
  id: number
  type: 'in' | 'out'
  inv_date: string
  code: string
  partner: string
  note: string
  items: InvoiceItem[]
  image_url?: string
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string | null
}

export interface AuditLog {
  id: number
  user_id: string
  user_name: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  entity: string
  entity_id: string | null
  detail: string | null
  created_at: string
}

export interface Product {
  id: number
  code: string
  name: string
  category: string
  unit: string
  cost_price: number
  sell_price: number
  stock_qty: number
  min_stock: number
  description: string
  is_active: boolean
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string | null
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export type PageName = 'recipes' | 'calc' | 'log' | 'invoices' | 'summary' | 'products' | 'admin' | 'users'

export interface Batch {
  id: number
  product_name: string
  inv_id: number
  inv_code: string
  inv_date: string
  quantity: number
  remaining_qty: number
  price: number
  unit: string
  mfg_date?: string
  exp_date?: string
  created_at: string
}

export interface BatchDeduction {
  id: number
  batch_id: number
  inv_id: number
  qty_used: number
  batch_inv_code: string
  batch_inv_date: string
  batch_price: number
  batch_unit: string
  created_at: string
}
