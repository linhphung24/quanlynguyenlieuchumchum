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

### UsersPage.tsx — Xoá người dùng
- Thêm nút 🗑 Xoá trong cột Thao tác — chỉ hiện với `profile.role === 'admin'`
- Không thể xoá chính mình (`p.id !== profile?.id`)
- Gọi API `POST /api/admin/delete-user` (dùng service role key)
- API xoá profile trước, sau đó gọi `auth.admin.deleteUser()` để xoá khỏi auth.users
- Cập nhật `allProfiles` state ngay sau khi xoá thành công (không cần reload)
- Ghi audit log sau khi xoá

### AppContext.tsx
- Thêm `setAllProfiles` vào `AppContextValue` interface và `value` object để các trang có thể cập nhật danh sách user locally

### src/app/api/admin/delete-user/route.ts (mới)
- POST endpoint nhận `{ userId }`
- Dùng service role key để gọi `adminClient.auth.admin.deleteUser(userId)`
- Xoá profile trước (phòng trường hợp không có CASCADE FK)

### Tab Nhân sự (PersonnelPage)
- Trang mới `src/components/personnel/PersonnelPage.tsx`
- Quyền truy cập: manager + admin
- Fields: full_name, dob, position, department, phone, is_active, notes
- Highlight sinh nhật tháng hiện tại (banner + icon 🎂 trên avatar)
- CRUD đầy đủ với slide-over form, dùng `DateInput` cho ngày sinh
- Audit log cho create/update/delete

### Trello Birthday Card
- API: `POST /api/trello/birthday-card`
- Query nhân sự `is_active=true`, lọc theo tháng hiện tại
- Tạo thẻ Trello: tên "🎂 Sinh nhật tháng X/YYYY", mô tả danh sách tên + ngày + chức vụ
- Env vars cần thêm: `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_LIST_ID`
- Lấy credentials: https://trello.com/app-key → API Key + Token; List ID từ URL board `.json`
- Scheduled task: chạy 8h sáng ngày 1 mỗi tháng (tạo qua Claude Code Scheduled Tasks)

### SQL cần chạy (Supabase Dashboard)
```sql
CREATE TABLE IF NOT EXISTS personnel (
  id          SERIAL PRIMARY KEY,
  full_name   TEXT NOT NULL,
  dob         DATE NOT NULL,
  position    TEXT,
  department  TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_by  TEXT NOT NULL DEFAULT '',
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);
```

### Fix: Loading state stuck (nút lưu mất phản hồi sau vài lần thao tác)
**Nguyên nhân**: `stopLoading()` đặt sau `try-catch` thay vì trong `finally` → khi async throw exception, `stopLoading()` không bao giờ được gọi → `loading=true` mãi mãi → UI bị khoá.

**Quy tắc bắt buộc**: MỌI handler có `startLoading()` đều PHẢI có `stopLoading()` trong `finally`:
```tsx
startLoading()
try {
  // ... async operations
} catch (e) {
  toast('Lỗi: ' + (e as Error).message, 'error')
} finally {
  stopLoading()  // ← LUÔN được gọi dù có lỗi hay không
}
```

**Đã fix trong**: `ProductsPage.tsx` (handleSave, handleDelete), `RecipesPage.tsx` (handleSave, handleDelete, handleCreate), `InvoicesPage.tsx` (handleDelete)

### Fix: Crash khi tìm kiếm sản phẩm (`p.code.toLowerCase()` trên null)
- `code` field được đổi thành `null` (thay vì `''`) để tránh duplicate key constraint
- `useMemo` filter trong ProductsPage gọi `p.code.toLowerCase()` → crash `TypeError: Cannot read properties of null`
- **Fix**: dùng `(p.code ?? '').toLowerCase()` để fallback về chuỗi rỗng khi null

### Fix: React Hooks violation trong PersonnelPage
- `useEffect` bị đặt SAU `if (profile?.role !== 'admin' ...) return` → vi phạm Rules of Hooks → crash toàn app khi re-render
- **Quy tắc**: Tất cả hooks (`useEffect`, `useMemo`, `useState`...) phải được gọi TRƯỚC bất kỳ `return` sớm nào
- **Fix**: chuyển `useEffect` lên trên, đặt role check BÊN TRONG effect body

### Fix: Bug case-sensitive matching khi xuất FIFO
- **Triệu chứng**: User gõ "Cam" (hoa) nhưng batch lưu "cam" (thường) → `.in('product_name', ['Cam'])` của Postgres case-sensitive → không tìm thấy → "Không có tồn kho" dù có hàng
- **Fix InvoicesPage.tsx** ở 4 chỗ: `computeBatchPreviews`, `deductBatchesFifo`, `handleSave validation` — thay `.in()` bằng query song song `.ilike()` (1/name); group key trong byProduct/oldestBatch luôn lowercase; `createBatchRecords` chuẩn hoá `product_name` về tên gốc trong products table

### Fix: Floating-point làm batch hiển thị 0 nhưng status "Còn hàng"
- **Triệu chứng**: Lô hiển thị `0 kg` còn lại nhưng badge vẫn "Còn hàng" → không xuất tiếp được
- **Nguyên nhân**: `toFixed(6)` lưu `0.000001` thay vì `0` vào DB → so sánh `<= 0` sai
- **Fix BatchesTab.tsx**: thêm helper `eff = (qty) => parseFloat(qty.toFixed(2))`, dùng cho `getBatchStatus`, `filtered`, `stats`
- **Fix InvoicesPage.tsx**: `toFixed(6)` → `toFixed(2)` khi lưu newRemaining + restored; FIFO preview/validation bỏ qua batch có `eff(remaining_qty) <= 0`

### Fix: Data inconsistency products.stock_qty vs batches.remaining_qty
- **Triệu chứng**: Tổng kết hiện tồn 36 nhưng FIFO báo "Không có lô tồn kho"
- **Nguyên nhân**:
  1. Một số sản phẩm seed qua SQL có `stock_qty > 0` nhưng không có batch
  2. Bug case-sensitive trước đây cho phép xuất "ảo" — validation `if (!batch) continue` silent pass khi không tìm thấy batch
  3. Kết quả: `products.stock_qty` cứ trừ đều, batches cạn từ lâu
- **Fix code** (`InvoicesPage.tsx` handleSave): thay `if (!batch) continue` bằng `violations.push(...)` → CHẶN xuất khi không có batch
- **Fix dữ liệu**: chạy `supabase/init_batches_for_existing_stock.sql` để tạo batch INIT (inv_id=0, inv_code='INIT-{product_id}') cho phần thiếu = `stock_qty - SUM(remaining_qty)`
- **An toàn**: batch INIT có `inv_id=0` nên không bị xoá khi xoá hoá đơn nào khác

### SummaryPage performance + search
- Thay 1 query `select('*')` toàn bộ lịch sử → 2 query song song có filter ngày (`gte/lte` trong tháng + `gt` sau tháng)
- Thêm ô search tên/mã SP trong bảng tổng hợp (client-side useMemo, không reload)
- Thêm try-catch-finally cho `loadData`, spinner xoay khi loading

### Khoá sửa tay stock_qty / cost_price (ProductsPage)
- **Lý do**: 2 field này quyết định Summary (`tonCuoi`, `tonDau`, `donGia`, `tienCuoi`). Sửa tay = phá lệch dữ liệu, gây tồn đầu âm như đã gặp.
- **Form ProductsPage**: 2 input đổi thành ô **read-only** (bg xám, icon 🔒, ghi chú "Tự động cập nhật từ HĐ")
- **handleSave**:
  - CREATE: ép `stock_qty=0, cost_price=0` (sẽ tự cập nhật ở HĐ nhập đầu)
  - UPDATE: STRIP `stock_qty` và `cost_price` khỏi payload bằng destructuring → dù bypass UI vẫn không ghi DB
- `sell_price` không ảnh hưởng Summary → vẫn cho sửa bình thường

### Cảnh báo Tồn đầu ÂM (Summary)
- **Triệu chứng**: Cột "Tồn đầu" trong Tổng kết hiển thị số âm
- **Nguyên nhân**: dữ liệu lệch giữa `products.stock_qty` và lịch sử `invoices` — thường do:
  1. Bug case-sensitive cũ cho phép xuất "ảo" (đã fix code, nhưng dữ liệu cũ còn lệch)
  2. Sản phẩm tạo mới với `stock_qty=0` nhưng đã có HĐ cũ
  3. HĐ nhập có `inv_date` ghi sai sang tháng tương lai
- **Fix UI** (`SummaryPage.tsx`): cell "Tồn đầu" tô đỏ + `bg-red-50` + tooltip giải thích khi giá trị âm
- **SQL chẩn đoán**: `supabase/diagnose_negative_opening_stock.sql` — 4 phần:
  - PHẦN 1: liệt kê SP có tồn đầu âm trong tháng X năm Y
  - PHẦN 2: soi chi tiết HĐ của 1 sản phẩm cụ thể
  - PHẦN 3: đối chiếu `stock_qty` vs (Σnhập − Σxuất) toàn lịch sử
  - PHẦN 4 (commented): đồng bộ stock_qty về đúng lịch sử → chạy LẠI `init_batches_for_existing_stock.sql`
