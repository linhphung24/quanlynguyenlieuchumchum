export interface Product {
  Id: number;
  Code: string;
  Name: string;
  Category: string;
  Unit: string;
  CostPrice: number;
  SellPrice: number;
  StockQty: number;
  MinStock: number;
  Supplier?: string;
  Description?: string;
  IsActive: boolean;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Invoice {
  Id: number;
  Type: 'in' | 'out';
  InvDate: string;
  Code: string;
  Partner: string;
  SupplierId?: number | null;
  Note: string;
  ImageUrl?: string;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  ApprovalStatus: 'approved' | 'pending' | 'rejected';
  ApprovedBy?: string;
  ApprovedAt?: string;
  TotalAmount: number;
}

export interface InvoiceDetail {
  Id?: number;
  InvoiceId?: number;
  ProductId?: number | null;
  ProductCode?: string;
  ProductName: string;
  Unit: string;
  Amount: number;
  Price: number;
  Subtotal?: number;
  MfgDate?: string | null;
  ExpDate?: string | null;
  BatchInfo?: string;
}

export interface Batch {
  Id: number;
  ProductName: string;
  InvoiceId: number;
  InvoiceCode: string;
  InvoiceDate: string;
  ProductCode: string;
  Quantity: number;
  RemainingQty: number;
  Price: number;
  Unit: string;
  MfgDate?: string | null;
  ExpDate?: string | null;
}

export interface BatchDeduction {
  Id: number;
  BatchId: number;
  InvoiceId: number;
  QtyUsed: number;
  BatchInvCode: string;
  BatchInvDate: string;
  BatchPrice: number;
  BatchUnit: string;
}

export interface StockOpeningAdj {
  Id?: number;
  ProductName: string;
  ProductCode?: string;
  Category?: string;
  Warehouse?: string;
  VoucherCode?: string;
  InvDate?: string;
  BatchNo?: string;
  ExpDate?: string | null;
  Specification?: string;
  Location?: string;
  Unit?: string;
  CostPrice?: number;
  Year: number;
  Month: number;
  AdjQty: number;
  CurrentStock?: number;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Recipe {
  Id: number;
  Name: string;
  BaseYield: number;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface RecipeIngredient {
  Id?: number;
  RecipeId: number;
  ProductName: string;
  Amount: number;
  Unit: string;
  Price: number;
  RequiredAmount?: number;
}

export interface Supplier {
  Id: number;
  Name: string;
  Phone: string;
  Address: string;
  Note: string;
  IsActive: boolean;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CashVoucher {
  Id: number;
  Type: 'thu' | 'chi';
  VoucherDate: string;
  Code: string;
  Partner: string;
  SupplierId?: number | null;
  PartnerAddress?: string;
  Receiver?: string;
  Reason: string;
  Amount: number;
  PaymentMethod?: string;
  AttachedDocs?: string;
  Note?: string;
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CashVoucherDetail {
  Id?: number;
  VoucherId?: number;
  Description: string;
  DebitAccount?: string;
  CreditAccount?: string;
  Amount: number;
}

export interface CompanyInfo {
  Id: number;
  Name: string;
  Address: string;
  TaxCode: string;
  Phone: string;
  UpdatedBy?: string;
  UpdatedAt?: string;
}

export interface User {
  Id: number;
  Username: string;
  FullName: string;
  Role: 'admin' | 'manager' | 'ketoan' | 'thukho' | 'staff';
  CreatedBy?: string;
  UpdatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface RolePermission {
  Id: number;
  Role: string;
  FeatureKey: string;
  FeatureName: string;
  CanView: boolean;
  CanCreate: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
}

export interface AuditLogItem {
  Id: number;
  UserId: string;
  UserName: string;
  Action: string;
  Entity: string;
  EntityId: string;
  Detail: string;
  CreatedAt: string;
}

export interface TongHopRow {
  STT: number;
  Code: string;
  Name: string;
  Category: string;
  Unit: string;
  DonGia: number;
  TonDau: number;
  TienDau: number;
  Nhap: number;
  TienNhap: number;
  Xuat: number;
  TienXuat: number;
  TonCuoi: number;
  TienCuoi: number;
  TonDauAuto: boolean;
}

export interface SupplierOpeningDebtItem {
  SupplierId: number;
  SupplierName: string;
  Phone?: string;
  Address?: string;
  OpeningDebt: number;
  OpeningDate: string;
  Note?: string;
  UpdatedAt?: string;
  UpdatedBy?: string;
}

export interface SupplierDebtSummary {
  SupplierId: number;
  SupplierName: string;
  Phone?: string;
  Address?: string;
  DauKy: number;
  TangTrongKy: number;
  GiamTrongKy: number;
  CuoiKy: number;
  Status: 'in_debt' | 'settled' | 'overpaid';
  InitialOpeningDebt?: number;
  InitialOpeningDate?: string;
}

export interface SupplierDebtTransaction {
  Id: number | string;
  DocType: 'nhap_kho' | 'xuat_kho' | 'phieu_chi' | 'phieu_thu';
  DocTypeName: string;
  DocDate: string;
  DocCode: string;
  Description: string;
  AmountIncrease: number;
  AmountDecrease: number;
  RunningBalance: number;
}

export interface SupplierDebtDetailReport {
  SupplierId: number;
  SupplierName: string;
  Phone?: string;
  Address?: string;
  FromDate: string;
  ToDate: string;
  DauKy: number;
  TangTrongKy: number;
  GiamTrongKy: number;
  CuoiKy: number;
  InitialOpeningDebt?: number;
  InitialOpeningDate?: string;
  InitialOpeningNote?: string;
  Transactions: SupplierDebtTransaction[];
}

export interface CashOpeningBalanceInfo {
  Id?: number;
  OpeningDate: string;
  OpeningAmount: number;
  Note?: string;
  UpdatedBy?: string;
  UpdatedAt?: string;
}

export interface CashReportItem {
  Id: number;
  VoucherDate: string;
  Code: string;
  Type: 'thu' | 'chi';
  Partner: string;
  Receiver: string;
  Reason: string;
  PaymentMethod: string;
  ThuAmount: number;
  ChiAmount: number;
  RunningBalance: number;
}

export interface CashReportData {
  fromDate: string;
  toDate: string;
  openingCash: number;
  totalThu: number;
  totalChi: number;
  netCash: number;
  closingCash: number;
  initialOpeningCash?: number;
  initialOpeningDate?: string;
  items: CashReportItem[];
}

export type AppModule = 'warehouse' | 'accounting' | 'pos';

export type PageName =
  | 'accounting-dashboard'
  | 'invoices'
  | 'batches'
  | 'vouchers'
  | 'cash-report'
  | 'debts'
  | 'stock-opening'
  | 'reports'
  | 'products'
  | 'recipes'
  | 'calc'
  | 'suppliers'
  | 'company-info'
  | 'users'
  | 'permissions'
  | 'audit-log'
  | 'pos-tables'
  | 'pos-menu'
  | 'pos-receipt-template'
  | 'pos-payment-settings'
  | 'pos-shifts';

export interface PosFloor {
  Id: number;
  Name: string;
  SortOrder: number;
  IsActive: boolean;
}

export interface PosTable {
  Id: number;
  FloorId: number;
  Code: string;
  Name: string;
  Capacity: number;
  Status: 'available' | 'occupied' | 'billing' | 'reserved';
  CurrentOrderId?: number | null;
  SortOrder: number;
  IsActive: boolean;
  CurrentOrder?: PosOrder | null;
}

export interface PosShift {
  Id: number;
  ShiftCode: string;
  CashierId: number;
  CashierName: string;
  OpenedAt: string;
  ClosedAt?: string | null;
  OpeningCash: number;
  ClosingCashActual?: number | null;
  TotalCashSales: number;
  TotalQRSales: number;
  TotalOtherSales: number;
  TotalPaidIn: number;
  TotalPaidOut: number;
  CashDifference?: number | null;
  Status: 'open' | 'closed';
  Notes?: string | null;
}

export interface PosMenuItemRecipe {
  Id?: number;
  MenuItemId?: number;
  ProductId?: number | null;
  ProductName: string;
  Amount: number;
  Unit: string;
  CostPrice?: number;
  Note?: string | null;
  CreatedAt?: string;
}

export interface PosMenuItem {
  Id: number;
  Code: string;
  Name: string;
  Category: string;
  Unit: string;
  Price: number;
  CostPrice: number;
  ImageUrl?: string | null;
  Description?: string | null;
  RecipeId?: number | null;
  IsActive: boolean;
  SortOrder: number;
  CreatedBy?: string;
  CreatedAt?: string;
  UpdatedBy?: string;
  UpdatedAt?: string | null;
  Recipes?: PosMenuItemRecipe[];
  RecipeCount?: number;
}

export interface PosOrder {
  Id: number;
  OrderCode: string;
  ShiftId?: number | null;
  TableId?: number | null;
  TableName?: string | null;
  OrderType: 'dine_in' | 'takeaway' | 'delivery';
  CustomerName?: string | null;
  CustomerPhone?: string | null;
  Subtotal: number;
  DiscountAmount: number;
  VatAmount: number;
  FinalAmount: number;
  PaymentMethod?: 'cash' | 'qr_transfer' | 'card' | 'split' | null;
  CashReceived: number;
  CashChange: number;
  PaymentStatus: 'unpaid' | 'paid' | 'cancelled';
  OrderStatus: 'serving' | 'completed' | 'cancelled';
  TransactionRef?: string | null;
  PaidAt?: string | null;
  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt?: string | null;
  ExportInvoiceId?: number | null;
  Details?: PosOrderDetail[];
}

export interface PosOrderDetail {
  Id?: number;
  OrderId: number;
  ProductId?: number;
  MenuItemId?: number | null;
  ProductCode?: string | null;
  ProductName: string;
  Unit: string;
  Quantity: number;
  Price: number;
  Discount: number;
  Subtotal: number;
  Note?: string | null;
  Status: 'ordered' | 'served' | 'cancelled';
}

export interface PosReceiptTemplate {
  Id: number;
  TemplateName: string;
  PaperSize: 'k80' | 'k57';
  ShopName: string;
  ShopAddress: string;
  ShopPhone: string;
  WifiInfo: string;
  HeaderTitle: string;
  FooterMessage: string;
  ShowLogo: boolean;
  ShowCashier: boolean;
  ShowTable: boolean;
  ShowCustomer: boolean;
  ShowItemNote: boolean;
  ShowQrCode: boolean;
  QrType: 'vietqr' | 'custom_url';
  CustomQrUrl?: string | null;
  IsDefault: boolean;
}

export interface PosPaymentSettings {
  Id: number;
  BankBin: string;
  BankName: string;
  AccountNumber: string;
  AccountHolder: string;
  QrPrefix: string;
  WebhookSecret?: string | null;
  IsActive: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

