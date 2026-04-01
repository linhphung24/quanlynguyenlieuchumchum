# Chum Chum Bakery — Quản lý Nguyên liệu

Ứng dụng quản lý kho & hoá đơn cho tiệm bánh. Single-page React app với Supabase backend.

## Tech stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: Supabase (PostgreSQL) — client: `@supabase/supabase-js`
- **Styling**: Tailwind CSS — màu chủ đạo `#c8773a` (cam), `#1a0f07` (nâu tối), `#fdf6ec` (kem)
- **Font**: Playfair Display (tiêu đề), DM Sans (body)
- **Thư viện**: `xlsx` (export Excel), `nodemailer` (email alerts), `cloudinary` (ảnh hoá đơn)

## Cấu trúc project

```
src/
  app/
    page.tsx              ← Entry point, layout sidebar + routing
    layout.tsx
    globals.css
    api/
      admin/send-reset/   ← Reset password email
      alerts/             ← Email cảnh báo tồn kho + hết hạn lô
  components/
    layout/
      Nav.tsx             ← Sidebar dọc tối (w-56), nhóm theo chức năng
      Header.tsx          ← Header slim: tiêu đề trang + badge cảnh báo
    invoices/
      InvoicesPage.tsx    ← Nhập/Xuất hoá đơn + FIFO batch tracking
      BatchesTab.tsx      ← Xem tồn kho theo lô hàng
    products/
      ProductsPage.tsx    ← Dashboard sản phẩm (màn mặc định)
    summary/SummaryPage.tsx
    recipes/RecipesPage.tsx
    log/LogPage.tsx
    shared/
      ImageUpload.tsx     ← Upload ảnh lên Cloudinary (bắt buộc khi lưu HĐ)
      ProductPicker.tsx   ← Autocomplete chọn sản phẩm
      DateInput.tsx       ← Hybrid: gõ dd/mm/yyyy hoặc calendar picker
      TextPicker.tsx      ← Autocomplete text (NCC/KH)
  contexts/
    AppContext.tsx         ← Global state: user, profile, allProducts, recipes
  types/index.ts           ← Tất cả TypeScript interfaces
  lib/
    supabase.ts            ← Supabase client singleton
    utils.ts               ← fmtDate, fmtPrice, fmtNum, genCode, todayStr...
    constants.ts           ← UNITS, ROLE_LABELS, ACTION_LABELS
```

## Database tables (Supabase)

| Bảng | Mô tả |
|------|-------|
| `profiles` | User profiles (full_name, role: admin/manager/staff) |
| `products` | Sản phẩm: stock_qty, min_stock, cost_price, sell_price |
| `invoices` | Hoá đơn: type='in'/'out', items (JSONB), image_url |
| `batches` | Lô hàng: tạo tự động khi nhập, remaining_qty giảm dần khi xuất |
| `batch_deductions` | Ghi lại lô nào bị trừ khi xuất (để reverse khi xoá HĐ) |
| `recipes` | Công thức bánh: ingredients (JSONB) |
| `daily_log` | Nhật ký sản xuất hàng ngày |
| `audit_log` | Lịch sử thao tác (create/update/delete/login/logout) |

## Logic nghiệp vụ quan trọng

### FIFO Batch Tracking
- Mỗi **dòng hàng trong hoá đơn nhập** → tạo 1 `batch` record
- Khi **xuất hàng**: tự động trừ từ batch cũ nhất (theo `inv_date ASC`)
- Khi **xoá hoá đơn nhập**: xoá batch records tương ứng
- Khi **xoá hoá đơn xuất**: khôi phục `remaining_qty` trong `batch_deductions`
- Preview FIFO hiện ngay trong form xuất (auto-compute 400ms debounce)

### Stock Update (`updateStock`)
- Gọi mỗi khi lưu/xoá hoá đơn
- `multiplier=1` khi lưu, `multiplier=-1` khi xoá (đảo ngược)
- Match product theo `name` (case-insensitive)

### Email Alerts (`POST /api/alerts`)
- Query: products có `stock_qty < min_stock` + batches có `exp_date ≤ 30 ngày`
- Gửi qua Gmail SMTP (nodemailer)
- Cần env vars: `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_*`, `ALERT_EMAIL_TO`

## Env vars cần có

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # chỉ dùng server-side (API routes)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=                      # Gmail App Password (16 ký tự)
ALERT_EMAIL_TO=
```

## Quy ước code

- **State management**: không dùng Redux/Zustand — dùng `useApp()` hook từ AppContext
- **Supabase client**: luôn lấy từ `useApp().sb` (client-side) hoặc tạo mới với service key (server/API)
- **Loading**: dùng `startLoading()` / `stopLoading()` từ AppContext (hiển thị LoadingBar)
- **Toast**: dùng `toast(message, type?)` từ AppContext
- **Audit log**: gọi `writeAudit(action, entity, entityId, detail)` sau mỗi thao tác quan trọng
- **Formatter functions**: dùng `fmtPrice`, `fmtNum`, `fmtDate` từ `@/lib/utils`
- **Màu sắc**: giữ nguyên palette warm bakery, không tự ý đổi màu chủ đạo

## Không làm

- Không xoá/thay `image_url` (ảnh hoá đơn bắt buộc khi lưu)
- Không bỏ `writeAudit` khỏi các thao tác CRUD
- Không dùng `useEffect` thừa — batch queries khi có thể
- Không thêm thư viện UI mới (giữ thuần Tailwind)
- Không commit `.env.local`

## Chạy dev

```bash
npm run dev   # http://localhost:3000
npm run build # kiểm tra trước khi deploy
```

## SQL migration

File `supabase/migration_batches.sql` — chạy trong Supabase Dashboard → SQL Editor để tạo bảng `batches` và `batch_deductions`.

Thêm cột `image_url` cho bảng `invoices` (nếu chưa có):
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS image_url TEXT;
```

File `supabase/reset_and_import_products.sql` — xoá sạch products/batches/batch_deductions rồi import ~430 sản phẩm mới (NL + VL categories).

## Thay đổi đã thực hiện

### Quy ước fix lỗi silent-fail (đã áp dụng toàn bộ)
- Mọi hàm `handleSave`/`handleCreate`/`handleDelete` phải có `try-catch`
- `if (!user) return` → phải hiển thị toast, KHÔNG silent return
- `.update()` phải dùng `.select().single()` để detect silent RLS failure (khi `data=null, error=null`)
- Sau update: kiểm tra `if (!updated) { toast('Không thể cập nhật — kiểm tra quyền...') }`

### ProductsPage.tsx
- Thêm category `'Vật liệu'` vào `CATEGORIES` array và `CAT_COLORS` (màu orange)
- Fix `handleSave`: thêm toast khi `!user`, thêm try-catch, thêm `.select().single()` cho update

### ImageUpload.tsx
- Thêm check env vars `CLOUD_NAME`/`UPLOAD_PRESET` — hiển thị lỗi rõ ràng nếu thiếu

### ProductPicker.tsx
- Fix scroll đóng dropdown: thêm `dropdownRef`, bỏ qua scroll event khi xảy ra bên trong dropdown
- Dùng `position: fixed` để thoát `overflow:hidden` container

### RecipesPage.tsx
- Fix `handleSave`: bỏ check `!profile` (không dùng, gây silent fail), thêm try-catch, `.select().single()`

### InvoicesPage.tsx
- Fix `handleSave`: thêm toast khi `!user`, bọc toàn bộ logic insert trong try-catch

### ProductsPage.tsx — Nhà cung cấp
- Thêm field `supplier?: string` (optional) vào `Product` interface trong `types/index.ts`
- Thêm input "Nhà cung cấp" vào form slide-over (sau Mã sản phẩm)
- Card view: hiển thị `🏭 Tên NCC` nhỏ bên cạnh badge danh mục
- Table view: thêm cột "Nhà CC" giữa Danh mục và ĐVT
- SQL cần chạy: `ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT NOT NULL DEFAULT '';`

### Bài học: TypeScript non-optional field gây lỗi compile
- Thêm field bắt buộc (`supplier: string`) vào interface → Next.js compile lỗi → overlay đỏ che toàn trang → mọi click đều không hoạt động
- **Quy tắc**: field mới từ DB luôn khai báo optional (`supplier?: string`) cho đến khi chắc chắn cột tồn tại trong tất cả môi trường
