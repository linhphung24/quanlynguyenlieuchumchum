'use client'

import React, { useState, useMemo, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Invoice } from '@/types'
import { fmtNum, fmtPrice, fmtDate, todayStr } from '@/lib/utils'
import DateInput from '@/components/shared/DateInput'
import ProductPicker from '@/components/shared/ProductPicker'
import ImageUpload from '@/components/shared/ImageUpload'
import * as XLSX from 'xlsx'

// ─── Date helpers ─────────────────────────────────────────────
function pad2(n: number) { return String(n).padStart(2, '0') }

function getRangeForPreset(preset: string): [string, string] {
  const d = new Date()
  const y = d.getFullYear(), m = d.getMonth()
  switch (preset) {
    case 'day':
      return [todayStr(), todayStr()]
    case 'week': {
      const dow = d.getDay() || 7
      const mon = new Date(d); mon.setDate(d.getDate() - dow + 1)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)]
    }
    case 'month': {
      const last = new Date(y, m + 1, 0).getDate()
      return [`${y}-${pad2(m + 1)}-01`, `${y}-${pad2(m + 1)}-${pad2(last)}`]
    }
    case 'quarter': {
      const q = Math.floor(m / 3)
      const qStartMonth = q * 3
      const qEndMonth   = qStartMonth + 2
      const last = new Date(y, qEndMonth + 1, 0).getDate()
      return [`${y}-${pad2(qStartMonth + 1)}-01`, `${y}-${pad2(qEndMonth + 1)}-${pad2(last)}`]
    }
    case 'year':
      return [`${y}-01-01`, `${y}-12-31`]
    default:
      return [todayStr(), todayStr()]
  }
}

// ─── Types ────────────────────────────────────────────────────
type TabKey = 'nxt' | 'chitiet' | 'kiekem' | 'congno' | 'tonghop'
type PeriodPreset = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface TongHopRow {
  code: string; name: string; unit: string; donGia: number
  tonDauSL: number; giaTriTonDau: number
  nhapSL: number; giaTriNhap: number
  xuatSL: number; giaTriXuat: number
  tonCuoiSL: number; giaTriTonCuoi: number
  tonToiThieu: number
  trangThai: 'het' | 'sap_het' | 'du'
}

interface NXTRow {
  code: string; name: string; unit: string
  tonDau: number; nhapSL: number; xuatSL: number; tonCuoi: number
  hasAdj: boolean       // true = tonDau lấy từ khai báo thủ công
  formulaTonDau: number // tonDau theo công thức (trước khi adj override)
}
interface Batch {
  id: number; inv_id: number; inv_code: string; inv_date: string
  product_name: string; unit: string; quantity: number; price: number
  remaining_qty: number; exp_date?: string | null; supplier?: string | null
}
interface LedgerRow {
  id: number; ngay: string; code: string; type: 'in' | 'out'
  partner: string; nhap: number; xuat: number; ton: number; price: number
}
interface DebtInvoice {
  id: number; code: string; inv_date: string; partner: string
  total: number; note: string
  paid: boolean; paid_at: string | null
  payment_bill_url: string | null; paid_by: string | null
}
interface DebtSupplier {
  partner: string; invoices: DebtInvoice[]
  totalAmount: number; paidAmount: number; unpaidAmount: number
  invoiceCount: number; unpaidCount: number
}

// ─── Print CSS ────────────────────────────────────────────────
const PCSS = `
* { box-sizing: border-box; }
body { font-family: "Times New Roman", Times, serif; font-size: 12px; color: #000; margin: 12mm 15mm; }
h2 { font-size: 15px; font-weight: bold; text-align: center; margin: 6px 0 2px; text-transform: uppercase; letter-spacing: 0.5px; }
.sub { text-align: center; font-size: 12px; margin-bottom: 10px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { border: 1px solid #333; padding: 3px 5px; }
th { background: #e8e8e8; text-align: center; font-weight: bold; font-size: 11px; }
td { font-size: 11px; }
.num { text-align: right; }
.ctr { text-align: center; }
.sign { margin-top: 28px; display: flex; justify-content: space-between; }
.sign-box { text-align: center; min-width: 17%; }
.sign-box .role { font-weight: bold; font-size: 11px; }
.sign-box .space { height: 44px; }
.sign-box .name { font-size: 10px; font-style: italic; }
.hdr { display: flex; justify-content: space-between; margin-bottom: 8px; }
.info { margin: 3px 0; font-size: 11px; }
.total-row { font-weight: bold; background: #f0f0f0; }
@media print { body { margin: 8mm 10mm; } }
`

// ─── Print: Báo cáo Nhập-Xuất-Tồn ────────────────────────────
function printNXT(rows: NXTRow[], dateFrom: string, dateTo: string) {
  const tNhapSL = rows.reduce((s, r) => s + r.nhapSL, 0)
  const tXuatSL = rows.reduce((s, r) => s + r.xuatSL, 0)
  const tDauSL  = rows.reduce((s, r) => s + r.tonDau, 0)
  const tCuoiSL = rows.reduce((s, r) => s + r.tonCuoi, 0)

  const bodyRows = rows.map((r, i) => `<tr>
    <td class="ctr">${i + 1}</td>
    <td class="ctr">${r.code || ''}</td>
    <td>${r.name}</td>
    <td class="ctr">${r.unit}</td>
    <td class="num">${fmtNum(r.tonDau)}</td>
    <td class="num">${r.nhapSL > 0.001 ? fmtNum(r.nhapSL) : ''}</td>
    <td class="num">${r.xuatSL > 0.001 ? fmtNum(r.xuatSL) : ''}</td>
    <td class="num" style="font-weight:bold">${fmtNum(r.tonCuoi)}</td>
  </tr>`).join('')

  const w = window.open('', '_blank')!
  w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
  <title>Báo cáo NXT</title><style>${PCSS}</style></head><body>
  <div class="hdr">
    <div><b>TIỆM BÁNH CHUM CHUM</b><br/><span class="info">Địa chỉ: ________________________________</span></div>
    <div style="text-align:right"><span class="info">Mẫu: BC-NXT</span></div>
  </div>
  <h2>Báo cáo nhập – xuất – tồn kho</h2>
  <div class="sub">Từ ngày <b>${fmtDate(dateFrom)}</b> đến ngày <b>${fmtDate(dateTo)}</b></div>
  <table>
    <thead>
      <tr>
        <th>STT</th><th>Mã SP</th>
        <th>Tên vật tư, hàng hoá</th><th>ĐVT</th>
        <th>Tồn đầu kỳ</th>
        <th>Nhập trong kỳ</th>
        <th>Xuất trong kỳ</th>
        <th>Tồn cuối kỳ</th>
      </tr>
      <tr style="font-style:italic;font-size:10px">
        <td class="ctr">A</td><td class="ctr">B</td><td class="ctr">C</td><td class="ctr">D</td>
        <td class="ctr">1</td><td class="ctr">2</td><td class="ctr">3</td><td class="ctr">4=1+2-3</td>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
      <tr class="total-row">
        <td colspan="4" class="ctr">CỘNG</td>
        <td class="num">${fmtNum(tDauSL)}</td>
        <td class="num">${fmtNum(tNhapSL)}</td>
        <td class="num">${fmtNum(tXuatSL)}</td>
        <td class="num">${fmtNum(tCuoiSL)}</td>
      </tr>
    </tbody>
  </table>
  <div class="sign">
    <div class="sign-box"><div class="role">Người lập</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ kho</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán trưởng</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Giám đốc</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── Print: Sổ chi tiết vật tư ────────────────────────────────
function printChiTiet(
  productName: string, unit: string,
  rows: LedgerRow[], tonDau: number,
  dateFrom: string, dateTo: string
) {
  const tonCuoi = rows.length > 0 ? rows[rows.length - 1].ton : tonDau
  const bodyRows = rows.map((r) => `<tr>
    <td class="ctr">${fmtDate(r.ngay)}</td>
    <td class="ctr">${r.code}</td>
    <td>${r.type === 'in' ? 'Nhập kho' : 'Xuất kho'}${r.partner ? ' — ' + r.partner : ''}</td>
    <td class="num">${r.nhap > 0.001 ? fmtNum(r.nhap) : ''}</td>
    <td class="num">${r.xuat > 0.001 ? fmtNum(r.xuat) : ''}</td>
    <td class="num" style="font-weight:bold">${fmtNum(r.ton)}</td>
  </tr>`).join('')

  const w = window.open('', '_blank')!
  w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
  <title>Sổ chi tiết — ${productName}</title><style>${PCSS}</style></head><body>
  <div class="hdr">
    <div><b>TIỆM BÁNH CHUM CHUM</b></div>
    <div style="text-align:right;font-size:11px">Mẫu S10-DN</div>
  </div>
  <h2>Sổ chi tiết vật tư, hàng hoá</h2>
  <div class="sub">Từ ngày <b>${fmtDate(dateFrom)}</b> đến ngày <b>${fmtDate(dateTo)}</b></div>
  <div class="info">Tên vật tư: <b>${productName}</b> &nbsp;&nbsp;&nbsp; Đơn vị tính: <b>${unit}</b></div>
  <table>
    <thead>
      <tr>
        <th>Ngày CT</th><th>Số chứng từ</th><th>Diễn giải</th>
        <th>Nhập</th><th>Xuất</th><th>Tồn lũy kế</th>
      </tr>
    </thead>
    <tbody>
      <tr style="font-style:italic">
        <td colspan="5" class="ctr">— Tồn đầu kỳ —</td>
        <td class="num"><b>${fmtNum(tonDau)}</b></td>
      </tr>
      ${bodyRows}
      <tr class="total-row">
        <td colspan="5" class="ctr">Tồn cuối kỳ</td>
        <td class="num">${fmtNum(tonCuoi)}</td>
      </tr>
    </tbody>
  </table>
  <div class="sign" style="justify-content:flex-end;gap:60px">
    <div class="sign-box"><div class="role">Người ghi sổ</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán trưởng</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── Print: Mẫu 05-VT Biên bản kiểm kê ──────────────────────
function printKiemKe05VT(
  products: Array<{ id: number; code: string; name: string; unit: string; cost_price: number; stock_qty: number }>,
  actualMap: Map<number, number>,
  kkDate: string
) {
  const rows = products.map((p, i) => {
    const soSach = p.stock_qty
    const actual = actualMap.has(p.id) ? actualMap.get(p.id)! : soSach
    const diff   = actual - soSach
    const gia    = p.cost_price || 0
    const thuaSL = diff > 0.001 ? diff : 0
    const thieuSL = diff < -0.001 ? -diff : 0
    return `<tr>
      <td class="ctr">${i + 1}</td>
      <td>${p.name}</td>
      <td class="ctr">${p.code || ''}</td>
      <td class="ctr">${p.unit}</td>
      <td class="num">${gia ? Number(gia).toLocaleString('vi-VN') : ''}</td>
      <td class="num">${fmtNum(soSach)}</td>
      <td class="num">${gia ? Number(soSach * gia).toLocaleString('vi-VN') : ''}</td>
      <td class="num">${fmtNum(actual)}</td>
      <td class="num">${gia ? Number(actual * gia).toLocaleString('vi-VN') : ''}</td>
      <td class="num">${thuaSL > 0.001 ? fmtNum(thuaSL) : ''}</td>
      <td class="num">${thuaSL > 0.001 && gia ? Number(thuaSL * gia).toLocaleString('vi-VN') : ''}</td>
      <td class="num">${thieuSL > 0.001 ? fmtNum(thieuSL) : ''}</td>
      <td class="num">${thieuSL > 0.001 && gia ? Number(thieuSL * gia).toLocaleString('vi-VN') : ''}</td>
    </tr>`
  }).join('')

  const w = window.open('', '_blank')!
  w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
  <title>Biên bản kiểm kê — Mẫu 05-VT</title>
  <style>${PCSS} table{font-size:10px;} th,td{padding:2px 4px;}</style></head><body>
  <div class="hdr">
    <div><b>TIỆM BÁNH CHUM CHUM</b><br/><span class="info">Bộ phận: Kho nguyên liệu</span></div>
    <div style="text-align:right;font-size:10px">
      <b>Mẫu số 05-VT</b><br/>
      (Ban hành theo Thông tư số 200/2014/TT-BTC<br/>ngày 22/12/2014 của Bộ Tài chính)
    </div>
  </div>
  <h2>Biên bản kiểm kê vật tư, sản phẩm, hàng hoá</h2>
  <div class="sub">Thời điểm kiểm kê: <b>${fmtDate(kkDate)}</b></div>
  <div class="info">Hội đồng kiểm kê gồm: _______________________________________________________</div>
  <div class="info">Đã tiến hành kiểm kê vật tư, hàng hoá tại kho và lập biên bản sau:</div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">STT</th>
        <th rowspan="2">Tên nhãn hiệu, quy cách, ký hiệu vật tư<br/>(sản phẩm, hàng hoá)</th>
        <th rowspan="2">Mã số</th>
        <th rowspan="2">ĐVT</th>
        <th rowspan="2">Đơn giá</th>
        <th colspan="2">Theo sổ kế toán</th>
        <th colspan="2">Kiểm kê thực tế</th>
        <th colspan="2">Chênh lệch thừa</th>
        <th colspan="2">Chênh lệch thiếu</th>
      </tr>
      <tr>
        <th>SL</th><th>Tiền</th>
        <th>SL</th><th>Tiền</th>
        <th>SL</th><th>Tiền</th>
        <th>SL</th><th>Tiền</th>
      </tr>
      <tr style="font-style:italic;font-size:9px">
        <td class="ctr">A</td><td class="ctr">B</td><td class="ctr">C</td>
        <td class="ctr">D</td><td class="ctr">E</td>
        <td class="ctr">1</td><td class="ctr">2</td><td class="ctr">3</td><td class="ctr">4</td>
        <td class="ctr">5</td><td class="ctr">6</td><td class="ctr">7</td><td class="ctr">8</td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="info" style="margin-top:12px">
    Biên bản lập xong hồi _____ giờ, ngày _____ tháng _____ năm _____<br/>
    Kết quả kiểm kê giao cho ____________________________________________ giữ.
  </div>
  <div class="sign" style="margin-top:20px">
    <div class="sign-box"><div class="role">Đại diện HĐ kiểm kê</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ kho</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán vật tư</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán trưởng</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ trưởng đơn vị</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── Print: Bảng tổng hợp kết quả kiểm kê ───────────────────
function printTongHopKiemKe(
  products: Array<{ id: number; code: string; name: string; unit: string; cost_price: number; stock_qty: number }>,
  actualMap: Map<number, number>,
  kkDate: string
) {
  const rows = products.map((p, i) => {
    const soSach  = p.stock_qty
    const actual  = actualMap.has(p.id) ? actualMap.get(p.id)! : soSach
    const diff    = actual - soSach
    const gia     = p.cost_price || 0
    const diffStyle = diff > 0.001 ? 'color:green' : diff < -0.001 ? 'color:red' : ''
    return `<tr>
      <td class="ctr">${i + 1}</td>
      <td class="ctr">${p.code || ''}</td>
      <td>${p.name}</td>
      <td class="ctr">${p.unit}</td>
      <td class="num">${fmtNum(soSach)}</td>
      <td class="num">${fmtNum(actual)}</td>
      <td class="num" style="${diffStyle}">${diff > 0.001 ? '+' : ''}${Math.abs(diff) > 0.001 ? fmtNum(diff) : '—'}</td>
      <td class="num" style="${diffStyle}">${gia && Math.abs(diff) > 0.001 ? Number(diff * gia).toLocaleString('vi-VN') : '—'}</td>
      <td></td>
    </tr>`
  }).join('')

  const w = window.open('', '_blank')!
  w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
  <title>Tổng hợp kết quả kiểm kê</title><style>${PCSS}</style></head><body>
  <div class="hdr">
    <div><b>TIỆM BÁNH CHUM CHUM</b></div>
  </div>
  <h2>Bảng tổng hợp kết quả kiểm kê hàng tồn kho</h2>
  <div class="sub">Ngày kiểm kê: <b>${fmtDate(kkDate)}</b></div>
  <table>
    <thead>
      <tr>
        <th>STT</th><th>Mã SP</th><th>Tên vật tư, hàng hoá</th><th>ĐVT</th>
        <th>Tồn sổ sách</th><th>Tồn thực tế</th>
        <th>Chênh lệch (SL)</th><th>Chênh lệch (tiền ₫)</th><th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sign">
    <div class="sign-box"><div class="role">Người lập</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ kho</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán trưởng</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ trưởng đơn vị</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── Print: Biên bản xử lý chênh lệch ───────────────────────
function printXuLyChenhLech(
  products: Array<{ id: number; code: string; name: string; unit: string; cost_price: number; stock_qty: number }>,
  actualMap: Map<number, number>,
  kkDate: string
) {
  const list = products
    .map(p => {
      const actual = actualMap.has(p.id) ? actualMap.get(p.id)! : p.stock_qty
      return { ...p, actual, diff: actual - p.stock_qty }
    })
    .filter(p => Math.abs(p.diff) > 0.001)

  if (list.length === 0) { alert('Không có chênh lệch để in.'); return }

  const rows = list.map((p, i) => {
    const diffStyle = p.diff > 0 ? 'color:green' : 'color:red'
    return `<tr>
      <td class="ctr">${i + 1}</td>
      <td>${p.name}</td>
      <td class="ctr">${p.unit}</td>
      <td class="num">${fmtNum(p.stock_qty)}</td>
      <td class="num">${fmtNum(p.actual)}</td>
      <td class="num" style="${diffStyle}">${p.diff > 0 ? '+' : ''}${fmtNum(p.diff)}</td>
      <td class="num" style="${diffStyle}">${p.cost_price ? Number(p.diff * p.cost_price).toLocaleString('vi-VN') : '—'}</td>
      <td style="min-width:80px"></td>
      <td style="min-width:80px"></td>
    </tr>`
  }).join('')

  const w = window.open('', '_blank')!
  w.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
  <title>Biên bản xử lý chênh lệch kiểm kê</title><style>${PCSS}</style></head><body>
  <div class="hdr">
    <div><b>TIỆM BÁNH CHUM CHUM</b></div>
  </div>
  <h2>Biên bản xử lý chênh lệch kiểm kê</h2>
  <div class="sub">Căn cứ kết quả kiểm kê ngày <b>${fmtDate(kkDate)}</b></div>
  <div class="info">Hội đồng kiểm kê đề xuất xử lý các chênh lệch sau:</div>
  <table>
    <thead>
      <tr>
        <th>STT</th><th>Tên vật tư, hàng hoá</th><th>ĐVT</th>
        <th>Sổ sách</th><th>Thực tế</th>
        <th>CL số lượng</th><th>CL tiền (₫)</th>
        <th>Nguyên nhân</th><th>Phương án xử lý</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="info" style="margin-top:12px;font-style:italic">
    Biên bản lập ngày _____ tháng _____ năm _____, có hiệu lực sau khi Thủ trưởng đơn vị phê duyệt.
  </div>
  <div class="sign">
    <div class="sign-box"><div class="role">Đại diện HĐ KK</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Kế toán trưởng</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
    <div class="sign-box"><div class="role">Thủ trưởng đơn vị</div><div class="space"></div><div class="name">(Ký, ghi rõ họ tên)</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`)
  w.document.close()
}

// ─── PRESET LABELS ────────────────────────────────────────────
const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'day',     label: 'Hôm nay' },
  { key: 'week',    label: 'Tuần này' },
  { key: 'month',   label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year',    label: 'Năm này' },
  { key: 'custom',  label: 'Tùy chọn' },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ReportsPage() {
  const { sb, allProducts, toast, user, profile, writeAudit } = useApp()

  // ── tab ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('nxt')

  // ── NXT state ────────────────────────────────────────────────
  const [nxtPreset,  setNxtPreset]  = useState<PeriodPreset>('month')
  const [nxtFrom,    setNxtFrom]    = useState(getRangeForPreset('month')[0])
  const [nxtTo,      setNxtTo]      = useState(getRangeForPreset('month')[1])
  const [nxtRows,       setNxtRows]       = useState<NXTRow[]>([])
  const [nxtBatches,    setNxtBatches]    = useState<Record<string, Batch[]>>({})
  const [nxtShowBatch,  setNxtShowBatch]  = useState(false)
  const [nxtLoading,    setNxtLoading]    = useState(false)
  const [nxtLoaded,     setNxtLoaded]     = useState(false)
  const [nxtSearch,     setNxtSearch]     = useState('')
  const [nxtPage,       setNxtPage]       = useState(1)
  // ── Khai báo tồn đầu kỳ ──────────────────────────────────────
  const [adjRefDate,      setAdjRefDate]      = useState<{ y: number; m: number } | null>(null)
  const [nxtOpeningAdj,   setNxtOpeningAdj]   = useState<Record<string, number>>({})   // đã lưu DB
  const [nxtOpeningLocal, setNxtOpeningLocal] = useState<Record<string, string>>({})   // đang edit
  const [showKhaiBao,     setShowKhaiBao]     = useState(false)
  const [kbSearch,        setKbSearch]        = useState('')
  const [savingAdj,       setSavingAdj]       = useState(false)
  const kbImportRef = useRef<HTMLInputElement>(null)

  // ── Chi tiết state ───────────────────────────────────────────
  const [cdProductId,   setCdProductId]   = useState<number | null>(null)
  const [cdProductName, setCdProductName] = useState('')
  const [cdFrom,        setCdFrom]        = useState(getRangeForPreset('month')[0])
  const [cdTo,        setCdTo]        = useState(getRangeForPreset('month')[1])
  const [cdRows,      setCdRows]      = useState<LedgerRow[]>([])
  const [cdTonDau,    setCdTonDau]    = useState(0)
  const [cdLoading,   setCdLoading]   = useState(false)
  const [cdLoaded,    setCdLoaded]    = useState(false)

  // ── Kiểm kê state ────────────────────────────────────────────
  const [kkDate,   setKkDate]   = useState(todayStr())
  const [kkActual, setKkActual] = useState<Map<number, number>>(new Map())
  const [kkSearch, setKkSearch] = useState('')

  // ── Công nợ nhập state ───────────────────────────────────────
  const [cnPreset,   setCnPreset]   = useState<PeriodPreset>('month')
  const [cnFrom,     setCnFrom]     = useState(getRangeForPreset('month')[0])
  const [cnTo,       setCnTo]       = useState(getRangeForPreset('month')[1])
  const [cnSuppliers, setCnSuppliers] = useState<DebtSupplier[]>([])
  const [cnLoading,  setCnLoading]  = useState(false)
  const [cnLoaded,   setCnLoaded]   = useState(false)
  const [cnSearch,   setCnSearch]   = useState('')
  const [cnFilter,   setCnFilter]   = useState<'all' | 'unpaid' | 'paid'>('all')
  const [cnExpanded, setCnExpanded] = useState<Set<string>>(new Set())
  // Modal xác nhận thanh toán + đính kèm bill
  const [payModalInv, setPayModalInv] = useState<DebtInvoice | null>(null)
  const [payBillUrl,  setPayBillUrl]  = useState('')
  const [savingPay,   setSavingPay]   = useState(false)
  // Modal xem bill đã đính kèm
  const [viewBillUrl, setViewBillUrl] = useState<string | null>(null)

  // ── Tổng hợp XNT state ──────────────────────────────────────
  const _now = new Date()
  const [thMonth,   setThMonth]   = useState(_now.getMonth() + 1)
  const [thYear,    setThYear]    = useState(_now.getFullYear())
  const [thRows,    setThRows]    = useState<TongHopRow[]>([])
  const [thLoading, setThLoading] = useState(false)
  const [thLoaded,  setThLoaded]  = useState(false)
  const [thSearch,  setThSearch]  = useState('')

  // ── Preset handler ───────────────────────────────────────────
  function applyNxtPreset(preset: PeriodPreset) {
    setNxtPreset(preset)
    if (preset !== 'custom') {
      const [f, t] = getRangeForPreset(preset)
      setNxtFrom(f); setNxtTo(t)
    }
    setNxtLoaded(false)
  }

  // ── NXT data load ────────────────────────────────────────────
  const loadNXT = async () => {
    if (!nxtFrom || !nxtTo) { toast('Chọn khoảng thời gian hợp lệ', 'error'); return }
    setNxtLoading(true)
    try {
      // ── Lấy TẤT CẢ hoá đơn có inv_date ≤ nxtTo ───────────────
      // Tồn đầu = Σ nhập − Σ xuất TRƯỚC kỳ (tính từ lịch sử hoá đơn, không suy từ stock_qty).
      // Nhập/Xuất trong kỳ = tổng số lượng theo hoá đơn. CHỈ SỐ LƯỢNG — không tính tiền.
      const PAGE = 1000
      const allInvs: Invoice[] = []; let pFrom = 0
      while (true) {
        const { data, error } = await sb.from('invoices').select('id, type, inv_date, items')
          .lte('inv_date', nxtTo)
          .range(pFrom, pFrom + PAGE - 1)
        if (error || !data || data.length === 0) break
        allInvs.push(...(data as Invoice[]))
        if (data.length < PAGE) break
        pFrom += PAGE
      }

      // Gộp theo sản phẩm: preNet (trước kỳ) + nhập/xuất trong kỳ
      type PMap = Record<string, { preNet: number; nhapSL: number; xuatSL: number }>
      const map: PMap = {}
      for (const inv of allInvs) {
        const isPre = inv.inv_date < nxtFrom
        for (const it of (inv.items as { name?: string; amount?: number }[])) {
          if (!it.name) continue
          const key = it.name.toLowerCase().trim()
          if (!map[key]) map[key] = { preNet: 0, nhapSL: 0, xuatSL: 0 }
          const amt = Number(it.amount) || 0
          if (isPre) {
            map[key].preNet += inv.type === 'in' ? amt : -amt
          } else if (inv.type === 'in') {
            map[key].nhapSL += amt
          } else {
            map[key].xuatSL += amt
          }
        }
      }

      // ── Fetch tồn thực tế theo lô (current batch stock) ─────────
      const { data: batchData } = await sb
        .from('batches')
        .select('product_name, remaining_qty')
        .gt('remaining_qty', 0.005)

      const batchStockMap: Record<string, number> = {}
      for (const b of (batchData || []) as { product_name: string; remaining_qty: number }[]) {
        const key = b.product_name.toLowerCase().trim()
        batchStockMap[key] = (batchStockMap[key] || 0) + b.remaining_qty
      }

      const rows: NXTRow[] = []
      for (const p of allProducts.filter(p => p.is_active)) {
        const key = p.name.toLowerCase().trim()
        const m   = map[key] || { preNet: 0, nhapSL: 0, xuatSL: 0 }
        const tonDau  = m.preNet
        // Tồn cuối = tồn thực tế theo lô, không dùng công thức tonDau + nhap - xuat
        const tonCuoi = parseFloat((batchStockMap[key] || 0).toFixed(2))

        // Bỏ qua mặt hàng không phát sinh trong kỳ & tồn 0 suốt
        if (Math.abs(tonDau) < 0.001 && m.nhapSL === 0 && m.xuatSL === 0 && tonCuoi < 0.001) continue

        rows.push({
          code: p.code || '', name: p.name, unit: p.unit,
          tonDau, nhapSL: m.nhapSL, xuatSL: m.xuatSL, tonCuoi,
          hasAdj: false,
          formulaTonDau: tonDau,
        })
      }

      rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'))

      // ── Load khai báo tồn đầu từ stock_opening_adj ────────────
      const fromDate = new Date(nxtFrom)
      const adjY = fromDate.getFullYear(), adjM = fromDate.getMonth() + 1
      setAdjRefDate({ y: adjY, m: adjM })

      const { data: adjData } = await sb
        .from('stock_opening_adj')
        .select('product_name, adj_qty')
        .eq('year', adjY).eq('month', adjM)

      const adjMap: Record<string, number> = {}
      for (const a of (adjData || []) as { product_name: string; adj_qty: number }[]) {
        adjMap[a.product_name.toLowerCase().trim()] = Number(a.adj_qty)
      }
      setNxtOpeningAdj(adjMap)

      // Khởi tạo editing state (hiển thị giá trị đã lưu hoặc rỗng)
      const initLocal: Record<string, string> = {}
      for (const p of allProducts.filter(p => p.is_active)) {
        const key = p.name.toLowerCase().trim()
        initLocal[key] = adjMap[key] !== undefined ? String(adjMap[key]) : ''
      }
      setNxtOpeningLocal(initLocal)

      // Áp dụng adj vào rows (override tonDau; tonCuoi giữ nguyên từ batch stock)
      for (const row of rows) {
        const key = row.name.toLowerCase().trim()
        if (adjMap[key] !== undefined) {
          row.tonDau = adjMap[key]
          row.hasAdj = true
        }
      }

      setNxtRows(rows)

      // ── Fetch batches TRONG KỲ (paginated) for batch breakdown view ──
      const allBatches: Batch[] = []; let bFrom = 0; const BPAGE = 1000
      while (true) {
        const { data: bd, error: be } = await sb.from('batches').select('*')
          .gte('inv_date', nxtFrom)
          .lte('inv_date', nxtTo)
          .order('product_name', { ascending: true })
          .order('inv_date',     { ascending: true })
          .order('id',           { ascending: true })
          .range(bFrom, bFrom + BPAGE - 1)
        if (be || !bd || bd.length === 0) break
        allBatches.push(...(bd as Batch[]))
        if (bd.length < BPAGE) break
        bFrom += BPAGE
      }
      const productSet = new Set(rows.map(r => r.name.toLowerCase().trim()))
      const batchMap: Record<string, Batch[]> = {}
      for (const b of allBatches) {
        const key = b.product_name.toLowerCase().trim()
        if (!productSet.has(key)) continue
        if (!batchMap[key]) batchMap[key] = []
        batchMap[key].push(b)
      }
      setNxtBatches(batchMap)
      setNxtLoaded(true)
    } catch (e) {
      toast('Lỗi tải báo cáo: ' + (e as Error).message, 'error')
    } finally {
      setNxtLoading(false)
    }
  }

  // ── Tải file mẫu khai báo tồn đầu ───────────────────────────
  const downloadKbTemplate = () => {
    if (!adjRefDate) return
    const header = ['STT', 'Tên sản phẩm', 'Mã SP', 'ĐVT', 'Tồn đầu khai báo']
    const rows = allProducts
      .filter(p => p.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((p, i) => {
        const key = p.name.toLowerCase().trim()
        const val = nxtOpeningLocal[key]
        return [
          i + 1,
          p.name,
          p.code || '',
          p.unit,
          val !== undefined && val !== '' ? parseFloat(val) : '',  // giá trị hiện tại hoặc trống
        ]
      })
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    // Khoá cột A-D (chỉ cho sửa cột E)
    ws['!cols'] = [{ wch: 6 }, { wch: 40 }, { wch: 16 }, { wch: 10 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'TonDauKy')
    XLSX.writeFile(wb, `MauKhaiBaoTonDau_T${adjRefDate.m}_${adjRefDate.y}.xlsx`)
  }

  // ── Import Excel khai báo tồn đầu ────────────────────────────
  const importKbExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]!]
        if (!ws) { toast('File không hợp lệ', 'error'); return }
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

        // Tìm header row (chứa "Tên sản phẩm"), dò tối đa 10 dòng đầu
        let headerIdx = -1
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i] as unknown[]
          if (row.some(c => String(c).toLowerCase().includes('tên sản phẩm'))) { headerIdx = i; break }
        }
        if (headerIdx === -1) { toast('Không tìm thấy cột "Tên sản phẩm" trong file', 'error'); return }

        const header = (rows[headerIdx] as unknown[]).map(c => String(c).toLowerCase().trim())
        const nameCol = header.findIndex(h => h.includes('tên sản phẩm'))

        // Ưu tiên cột giá trị: "tồn đầu khai báo" → "tồn cuối" → "tồn đầu"
        let valCol = header.findIndex(h => h.includes('tồn đầu khai báo'))
        let usedColLabel = 'Tồn đầu khai báo'
        if (valCol === -1) {
          valCol = header.findIndex(h => h.includes('tồn cuối'))
          usedColLabel = 'Tồn cuối'
        }
        if (valCol === -1) {
          valCol = header.findIndex(h => h.includes('tồn đầu'))
          usedColLabel = 'Tồn đầu'
        }

        if (nameCol === -1 || valCol === -1) {
          toast('File thiếu cột "Tên sản phẩm" hoặc cột tồn kho', 'error'); return
        }

        // Helper: parse số kiểu VN (dấu phẩy = thập phân), âm → 0
        const parseQty = (raw: unknown): string => {
          if (raw === '' || raw === null || raw === undefined) return ''
          const n = parseFloat(String(raw).replace(',', '.').trim())
          if (isNaN(n)) return '0'
          return String(Math.max(0, n))
        }

        let matched = 0, skipped = 0
        const updates: Record<string, string> = {}
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i] as unknown[]
          const name = String(row[nameCol] ?? '').trim()
          if (!name) continue
          const key = name.toLowerCase().trim()
          const product = allProducts.find(p => p.name.toLowerCase().trim() === key)
          if (!product) { skipped++; continue }
          updates[key] = parseQty(row[valCol])
          matched++
        }

        setNxtOpeningLocal(prev => ({ ...prev, ...updates }))
        toast(`✅ Đã import ${matched} sản phẩm (cột: ${usedColLabel})${skipped > 0 ? ` — bỏ qua ${skipped} không khớp tên` : ''}. Nhấn Lưu khai báo để lưu.`)
      } catch {
        toast('Lỗi đọc file Excel', 'error')
      } finally {
        // Reset input để có thể chọn lại cùng file
        if (kbImportRef.current) kbImportRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── Lưu khai báo tồn đầu kỳ ─────────────────────────────────
  const saveOpeningAdj = async (setAllZero = false) => {
    if (!adjRefDate) return
    const canWrite = profile?.role === 'admin' || profile?.role === 'manager'
    if (!canWrite) { toast('Chỉ Admin/Manager được khai báo tồn đầu', 'error'); return }
    setSavingAdj(true)
    try {
      const localMap = setAllZero
        ? Object.fromEntries(allProducts.filter(p => p.is_active).map(p => [p.name.toLowerCase().trim(), '0']))
        : nxtOpeningLocal

      // Dedup theo tên (case-insensitive) để tránh lỗi ON CONFLICT duplicate
      const seen = new Set<string>()
      const upsertData = allProducts
        .filter(p => p.is_active)
        .filter(p => {
          const k = p.name.toLowerCase().trim()
          if (seen.has(k)) return false
          seen.add(k); return true
        })
        .map(p => ({
          product_name: p.name,
          year:         adjRefDate.y,
          month:        adjRefDate.m,
          adj_qty:      parseFloat(localMap[p.name.toLowerCase().trim()] || '0') || 0,
          updated_by:   user?.email || '',
        }))

      const { error } = await sb
        .from('stock_opening_adj')
        .upsert(upsertData, { onConflict: 'product_name,year,month' })

      if (error) { toast('Lỗi lưu: ' + error.message, 'error'); return }
      toast(`✅ Đã lưu khai báo tồn đầu tháng ${adjRefDate.m}/${adjRefDate.y} (${upsertData.length} sản phẩm)`)
      if (setAllZero) setNxtOpeningLocal(localMap)
      setNxtLoaded(false)
      await loadNXT()
    } finally {
      setSavingAdj(false)
    }
  }

  // ── Chi tiết data load ───────────────────────────────────────
  const loadChiTiet = async () => {
    const product = allProducts.find(p => p.id === cdProductId)
    if (!product) { toast('Chọn sản phẩm cần xem', 'error'); return }
    setCdLoading(true)
    try {
      const [{ data: pData }, { data: postData }] = await Promise.all([
        sb.from('invoices').select('*').gte('inv_date', cdFrom).lte('inv_date', cdTo).order('inv_date').order('id'),
        sb.from('invoices').select('*').gt('inv_date', cdTo),
      ])

      const pKey = product.name.toLowerCase().trim()
      let postNhap = 0, postXuat = 0
      for (const inv of (postData || []) as Invoice[]) {
        for (const it of (inv.items as { name?: string; amount?: number }[])) {
          if (it.name?.toLowerCase().trim() !== pKey) continue
          const amt = Number(it.amount) || 0
          if (inv.type === 'in') postNhap += amt; else postXuat += amt
        }
      }

      let perNhap = 0, perXuat = 0
      const rows: LedgerRow[] = []
      for (const inv of (pData || []) as Invoice[]) {
        for (const it of (inv.items as { name?: string; amount?: number; price?: number }[])) {
          if (it.name?.toLowerCase().trim() !== pKey) continue
          const amt   = Number(it.amount) || 0
          const price = Number(it.price)  || 0
          if (inv.type === 'in') perNhap += amt; else perXuat += amt
          rows.push({
            id: inv.id, ngay: inv.inv_date, code: inv.code, type: inv.type,
            partner: inv.partner || '',
            nhap: inv.type === 'in' ? amt : 0,
            xuat: inv.type === 'out' ? amt : 0,
            ton: 0, price,
          })
        }
      }

      const tonCuoi = product.stock_qty - postNhap + postXuat
      const tonDau  = tonCuoi - perNhap + perXuat

      let running = tonDau
      for (const row of rows) { running += row.nhap - row.xuat; row.ton = running }

      setCdTonDau(tonDau); setCdRows(rows); setCdLoaded(true)
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      setCdLoading(false)
    }
  }

  // ── Kiểm kê products (filtered) ──────────────────────────────
  const kkProducts = useMemo(() =>
    allProducts
      .filter(p => p.is_active && (
        kkSearch === '' ||
        p.name.toLowerCase().includes(kkSearch.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(kkSearch.toLowerCase())
      ))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  , [allProducts, kkSearch])

  // discrepancy count
  const kkDiffCount = useMemo(() =>
    kkProducts.filter(p => {
      const actual = kkActual.has(p.id) ? kkActual.get(p.id)! : p.stock_qty
      return Math.abs(actual - p.stock_qty) > 0.001
    }).length
  , [kkProducts, kkActual])

  // ── NXT filtered + paging ────────────────────────────────────
  const NXT_PAGE_SIZE = 20

  const filteredNXT = useMemo(() => {
    const q = nxtSearch.toLowerCase()
    const result = nxtSearch
      ? nxtRows.filter(r => r.name.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q))
      : nxtRows
    setNxtPage(1)   // reset về trang 1 khi filter thay đổi
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nxtRows, nxtSearch])

  const nxtTotalPages = Math.max(1, Math.ceil(filteredNXT.length / NXT_PAGE_SIZE))
  const safePage      = Math.min(nxtPage, nxtTotalPages)
  const pagedNXT      = filteredNXT.slice((safePage - 1) * NXT_PAGE_SIZE, safePage * NXT_PAGE_SIZE)

  const nxtTotals = useMemo(() => ({
    nhapSL: filteredNXT.reduce((s, r) => s + r.nhapSL, 0),
    xuatSL: filteredNXT.reduce((s, r) => s + r.xuatSL, 0),
  }), [filteredNXT])

  // ── Excel export NXT ─────────────────────────────────────────
  const exportNXTExcel = () => {
    const header = ['STT','Mã SP','Tên vật tư','ĐVT','Tồn đầu kỳ','Nhập','Xuất','Tồn cuối kỳ']
    const data   = filteredNXT.map((r, i) => [
      i + 1, r.code, r.name, r.unit,
      r.tonDau, r.nhapSL, r.xuatSL, r.tonCuoi,
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'NXT')
    XLSX.writeFile(wb, `BC_NXT_${nxtFrom}_${nxtTo}.xlsx`)
  }

  // ── Excel export Chi tiết ────────────────────────────────────
  const exportCdExcel = () => {
    const p = allProducts.find(x => x.id === cdProductId)
    if (!p) return
    const header = ['Ngày','Số CT','Loại','Đối tác','Nhập','Xuất','Tồn lũy kế']
    const data   = cdRows.map(r => [fmtDate(r.ngay), r.code, r.type === 'in' ? 'Nhập' : 'Xuất', r.partner, r.nhap || '', r.xuat || '', r.ton])
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ChiTiet')
    XLSX.writeFile(wb, `SoChiTiet_${p.name}_${cdFrom}_${cdTo}.xlsx`)
  }

  // ── Excel export Kiểm kê ─────────────────────────────────────
  const exportKkExcel = () => {
    const header = ['STT','Mã SP','Tên','ĐVT','Tồn sổ sách','Tồn thực tế','Chênh lệch']
    const data   = kkProducts.map((p, i) => {
      const actual = kkActual.has(p.id) ? kkActual.get(p.id)! : p.stock_qty
      return [i + 1, p.code || '', p.name, p.unit, p.stock_qty, actual, actual - p.stock_qty]
    })
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'KiemKe')
    XLSX.writeFile(wb, `KiemKe_${kkDate}.xlsx`)
  }

  // ── Công nợ: preset handler ──────────────────────────────────
  function applyCnPreset(preset: PeriodPreset) {
    setCnPreset(preset)
    if (preset !== 'custom') {
      const [f, t] = getRangeForPreset(preset)
      setCnFrom(f); setCnTo(t)
    }
    setCnLoaded(false)
  }

  // ── Công nợ: tải dữ liệu, gộp theo NCC ───────────────────────
  const loadCongNo = async () => {
    if (!cnFrom || !cnTo) { toast('Chọn khoảng thời gian hợp lệ', 'error'); return }
    setCnLoading(true)
    try {
      const PAGE = 1000
      const invs: Invoice[] = []; let pFrom = 0
      while (true) {
        const { data, error } = await sb.from('invoices').select('*')
          .eq('type', 'in')
          .gte('inv_date', cnFrom).lte('inv_date', cnTo)
          .order('inv_date', { ascending: false })
          .range(pFrom, pFrom + PAGE - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        invs.push(...(data as Invoice[]))
        if (data.length < PAGE) break
        pFrom += PAGE
      }

      // Gộp theo nhà cung cấp (partner)
      const map = new Map<string, DebtInvoice[]>()
      for (const inv of invs) {
        const total = (inv.items as { amount?: number; price?: number }[])
          .reduce((s, it) => s + (Number(it.amount) || 0) * (Number(it.price) || 0), 0)
        const partner = (inv.partner || '').trim() || '(Không ghi NCC)'
        const raw = inv as Invoice & { paid?: boolean; paid_at?: string; payment_bill_url?: string; paid_by?: string }
        const di: DebtInvoice = {
          id: inv.id, code: inv.code, inv_date: inv.inv_date, partner,
          total, note: inv.note || '',
          paid: !!raw.paid, paid_at: raw.paid_at || null,
          payment_bill_url: raw.payment_bill_url || null, paid_by: raw.paid_by || null,
        }
        if (!map.has(partner)) map.set(partner, [])
        map.get(partner)!.push(di)
      }

      const suppliers: DebtSupplier[] = []
      for (const [partner, list] of map) {
        const totalAmount = list.reduce((s, i) => s + i.total, 0)
        const paidAmount  = list.filter(i => i.paid).reduce((s, i) => s + i.total, 0)
        suppliers.push({
          partner, invoices: list,
          totalAmount, paidAmount, unpaidAmount: totalAmount - paidAmount,
          invoiceCount: list.length, unpaidCount: list.filter(i => !i.paid).length,
        })
      }
      // Sắp xếp: còn nợ nhiều nhất lên đầu
      suppliers.sort((a, b) => b.unpaidAmount - a.unpaidAmount)

      setCnSuppliers(suppliers)
      setCnExpanded(new Set())
      setCnLoaded(true)
    } catch (e) {
      toast('Lỗi tải công nợ: ' + (e as Error).message, 'error')
    } finally {
      setCnLoading(false)
    }
  }

  // ── Cập nhật trạng thái thanh toán 1 hoá đơn ─────────────────
  const updatePaidStatus = async (inv: DebtInvoice, paid: boolean, billUrl: string) => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return false }
    const payload = paid
      ? { paid: true, paid_at: new Date().toISOString(), payment_bill_url: billUrl || null, paid_by: profile?.full_name || user.email || '' }
      : { paid: false, paid_at: null, payment_bill_url: null, paid_by: null }
    const { data, error } = await sb.from('invoices').update(payload).eq('id', inv.id).select().single()
    if (error) { toast('Lỗi cập nhật: ' + error.message, 'error'); return false }
    if (!data) { toast('Không thể cập nhật — kiểm tra quyền truy cập', 'error'); return false }

    // Cập nhật state cục bộ
    setCnSuppliers(prev => prev.map(sup => {
      if (!sup.invoices.some(i => i.id === inv.id)) return sup
      const invoices = sup.invoices.map(i => i.id === inv.id
        ? { ...i, paid, paid_at: payload.paid_at, payment_bill_url: payload.payment_bill_url, paid_by: payload.paid_by }
        : i)
      const paidAmount = invoices.filter(i => i.paid).reduce((s, i) => s + i.total, 0)
      return {
        ...sup, invoices, paidAmount,
        unpaidAmount: sup.totalAmount - paidAmount,
        unpaidCount: invoices.filter(i => !i.paid).length,
      }
    }))
    await writeAudit('update', 'invoice_payment', String(inv.id),
      `${inv.code} — ${paid ? 'Đã thanh toán' : 'Bỏ thanh toán'}`)
    return true
  }

  // ── Mở modal xác nhận thanh toán ─────────────────────────────
  const openPayModal = (inv: DebtInvoice) => {
    setPayModalInv(inv)
    setPayBillUrl(inv.payment_bill_url || '')
  }

  const confirmPay = async () => {
    if (!payModalInv) return
    setSavingPay(true)
    try {
      const ok = await updatePaidStatus(payModalInv, true, payBillUrl)
      if (ok) { toast('Đã đánh dấu thanh toán', 'success'); setPayModalInv(null) }
    } finally {
      setSavingPay(false)
    }
  }

  const unmarkPaid = async (inv: DebtInvoice) => {
    const ok = await updatePaidStatus(inv, false, '')
    if (ok) toast('Đã chuyển về chưa thanh toán', 'success')
  }

  const toggleCnExpand = (partner: string) => {
    setCnExpanded(prev => {
      const next = new Set(prev)
      if (next.has(partner)) next.delete(partner); else next.add(partner)
      return next
    })
  }

  // ── Công nợ: lọc + tổng ──────────────────────────────────────
  const filteredCnSuppliers = useMemo(() => {
    const q = cnSearch.trim().toLowerCase()
    return cnSuppliers
      .map(sup => {
        // Lọc hoá đơn theo trạng thái thanh toán
        const invoices = cnFilter === 'all'
          ? sup.invoices
          : sup.invoices.filter(i => cnFilter === 'paid' ? i.paid : !i.paid)
        return { ...sup, _visibleInvoices: invoices }
      })
      .filter(sup => {
        if (q && !sup.partner.toLowerCase().includes(q)) return false
        if (cnFilter !== 'all' && sup._visibleInvoices.length === 0) return false
        return true
      })
  }, [cnSuppliers, cnSearch, cnFilter])

  const cnTotals = useMemo(() => ({
    total:  cnSuppliers.reduce((s, x) => s + x.totalAmount, 0),
    paid:   cnSuppliers.reduce((s, x) => s + x.paidAmount, 0),
    unpaid: cnSuppliers.reduce((s, x) => s + x.unpaidAmount, 0),
  }), [cnSuppliers])

  // ── Excel export Công nợ ─────────────────────────────────────
  const exportCnExcel = () => {
    const header = ['Nhà cung cấp', 'Mã HĐ', 'Ngày nhập', 'Số tiền', 'Trạng thái', 'Ngày thanh toán', 'Người TT', 'Ghi chú']
    const data: (string | number)[][] = []
    for (const sup of cnSuppliers) {
      for (const inv of sup.invoices) {
        data.push([
          sup.partner, inv.code, fmtDate(inv.inv_date), inv.total,
          inv.paid ? 'Đã thanh toán' : 'Chưa thanh toán',
          inv.paid_at ? fmtDate(inv.paid_at) : '', inv.paid_by || '', inv.note,
        ])
      }
      data.push([`→ ${sup.partner}: Tổng ${sup.totalAmount} | Đã trả ${sup.paidAmount} | Còn nợ ${sup.unpaidAmount}`, '', '', '', '', '', '', ''])
    }
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    ws['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 24 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CongNoNhap')
    XLSX.writeFile(wb, `CongNoNhap_${cnFrom}_${cnTo}.xlsx`)
  }

  // ── Tổng hợp XNT: load ──────────────────────────────────────
  const loadTongHop = async () => {
    setThLoading(true)
    try {
      const y = thYear, m = thMonth
      const startStr = `${y}-${String(m).padStart(2,'0')}-01`
      const lastDay  = new Date(y, m, 0).getDate()
      const endStr   = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`

      const PAGE = 1000
      const allInvs: Invoice[] = []; let pg = 0
      while (true) {
        const { data, error } = await sb.from('invoices').select('id, type, inv_date, items')
          .lte('inv_date', endStr).range(pg, pg + PAGE - 1)
        if (error || !data || data.length === 0) break
        allInvs.push(...(data as Invoice[])); if (data.length < PAGE) break; pg += PAGE
      }

      const { data: afterRaw } = await sb.from('invoices').select('type, items').gt('inv_date', endStr)
      const { data: batchRaw  } = await sb.from('batches').select('product_name, remaining_qty').gt('remaining_qty', 0.005)

      // batch stock map
      const batchMap: Record<string, number> = {}
      for (const b of (batchRaw || []) as { product_name: string; remaining_qty: number }[]) {
        const k = b.product_name.toLowerCase().trim()
        batchMap[k] = (batchMap[k] || 0) + b.remaining_qty
      }

      // future invoices (after period) for backward tonDau calc
      const futMap: Record<string, { fn: number; fx: number }> = {}
      for (const inv of (afterRaw || []) as { type: string; items: { name?: string; amount?: number }[] }[]) {
        for (const it of inv.items) {
          if (!it.name) continue
          const k = it.name.toLowerCase().trim()
          if (!futMap[k]) futMap[k] = { fn: 0, fx: 0 }
          const amt = Number(it.amount) || 0
          if (inv.type === 'in') futMap[k].fn += amt; else futMap[k].fx += amt
        }
      }

      // aggregate invoices in period + compute giá trị nhập/xuất
      type PMap = Record<string, { nhapSL: number; giaTriNhap: number; xuatSL: number; giaTriXuat: number }>
      const map: PMap = {}
      for (const inv of allInvs) {
        if (inv.inv_date < startStr || inv.inv_date > endStr) continue
        for (const it of (inv.items as { name?: string; amount?: number; price?: number }[])) {
          if (!it.name) continue
          const k   = it.name.toLowerCase().trim()
          if (!map[k]) map[k] = { nhapSL: 0, giaTriNhap: 0, xuatSL: 0, giaTriXuat: 0 }
          const amt = Number(it.amount) || 0
          const val = amt * (Number(it.price) || 0)
          if (inv.type === 'in')  { map[k].nhapSL += amt; map[k].giaTriNhap += val }
          else                    { map[k].xuatSL += amt; map[k].giaTriXuat += val }
        }
      }

      const rows: TongHopRow[] = []
      for (const p of allProducts.filter(p => p.is_active)) {
        const k   = p.name.toLowerCase().trim()
        const m2  = map[k] || { nhapSL: 0, giaTriNhap: 0, xuatSL: 0, giaTriXuat: 0 }
        const fut = futMap[k] || { fn: 0, fx: 0 }
        const bq  = parseFloat((batchMap[k] || 0).toFixed(2))
        const tonCuoiSL  = parseFloat((bq + fut.fx - fut.fn).toFixed(2))
        const tonDauSL   = parseFloat((tonCuoiSL - m2.nhapSL + m2.xuatSL).toFixed(2))
        if (tonDauSL === 0 && tonCuoiSL === 0 && m2.nhapSL === 0 && m2.xuatSL === 0) continue
        const donGia       = Number(p.cost_price) || 0
        const giaTriTonDau  = parseFloat((tonDauSL * donGia).toFixed(0))
        const giaTriTonCuoi = parseFloat((tonCuoiSL * donGia).toFixed(0))
        const tonToiThieu  = Number(p.min_stock) || 0
        const trangThai: TongHopRow['trangThai'] =
          tonCuoiSL <= 0 ? 'het' :
          tonToiThieu > 0 && tonCuoiSL <= tonToiThieu ? 'sap_het' : 'du'
        rows.push({
          code: p.code || '', name: p.name, unit: p.unit, donGia,
          tonDauSL, giaTriTonDau,
          nhapSL: m2.nhapSL, giaTriNhap: parseFloat(m2.giaTriNhap.toFixed(0)),
          xuatSL: m2.xuatSL, giaTriXuat: parseFloat(m2.giaTriXuat.toFixed(0)),
          tonCuoiSL, giaTriTonCuoi,
          tonToiThieu, trangThai,
        })
      }
      rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setThRows(rows); setThLoaded(true)
    } catch (e) {
      toast('Lỗi tải báo cáo: ' + (e as Error).message, 'error')
    } finally {
      setThLoading(false)
    }
  }

  const exportTongHopExcel = () => {
    const header = ['STT','Mã SP','Tên hàng hóa','ĐVT','Đơn giá nhập',
      'Tồn đầu SL','Tồn đầu GT','Nhập SL','Nhập GT','Xuất SL','Xuất GT',
      'Tồn cuối SL','Tồn cuối GT','Tồn tối thiểu','Trạng thái']
    const data = thRows
      .filter(r => thSearch === '' || r.name.toLowerCase().includes(thSearch.toLowerCase()) || r.code.toLowerCase().includes(thSearch.toLowerCase()))
      .map((r, i) => [
        i + 1, r.code, r.name, r.unit, r.donGia,
        r.tonDauSL, r.giaTriTonDau, r.nhapSL, r.giaTriNhap, r.xuatSL, r.giaTriXuat,
        r.tonCuoiSL, r.giaTriTonCuoi, r.tonToiThieu || '',
        r.trangThai === 'het' ? 'HẾT HÀNG' : r.trangThai === 'sap_het' ? 'SẮP HẾT' : 'ĐỦ HÀNG',
      ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    ws['!cols'] = [4,10,36,7,12,10,14,10,14,10,14,12,14,12,12].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'BC_TONG_HOP_XNT')
    XLSX.writeFile(wb, `BC_TongHopXNT_T${thMonth}_${thYear}.xlsx`)
  }

  // ── Shared UI atoms ──────────────────────────────────────────
  const sectionBox = 'bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]'
  const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer'
  const btnOutline = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c8773a] text-[#c8773a] text-xs font-medium hover:bg-[#fef4e8] transition-all cursor-pointer'
  const inputCls  = 'border border-[#e8ddd0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c8773a] focus:ring-1 focus:ring-[#c8773a]/20'

  const TABS = [
    { key: 'nxt'      as TabKey, label: '📊 Nhập-Xuất-Tồn' },
    { key: 'tonghop'  as TabKey, label: '📦 Tổng hợp XNT' },
    { key: 'chitiet'  as TabKey, label: '📋 Sổ chi tiết' },
    { key: 'kiekem'   as TabKey, label: '🔍 Kiểm kê định kỳ' },
    { key: 'congno'   as TabKey, label: '💳 Công nợ nhập' },
  ]

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1a0f07] font-['Playfair_Display']">Báo cáo kho</h2>
        <p className="text-sm text-[#8b5e3c]/70 mt-0.5">Báo cáo nhập-xuất-tồn, sổ chi tiết & biên bản kiểm kê</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f5e6cc]/50 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-white text-[#c8773a] shadow-sm'
                : 'text-[#8b5e3c]/70 hover:text-[#3d1f0a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: NXT ═══════════════════════════════════════════ */}
      {tab === 'nxt' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex flex-wrap items-end gap-3">
              {/* Preset buttons */}
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1.5 font-medium">Kỳ báo cáo</div>
                <div className="flex flex-wrap gap-1">
                  {PRESETS.map(pr => (
                    <button
                      key={pr.key}
                      onClick={() => applyNxtPreset(pr.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        nxtPreset === pr.key
                          ? 'bg-[#c8773a] text-white'
                          : 'bg-[#f5e6cc] text-[#8b5e3c] hover:bg-[#e8d5b7]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date inputs */}
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Từ ngày</div>
                  <DateInput value={nxtFrom} onChange={v => { setNxtFrom(v); setNxtPreset('custom'); setNxtLoaded(false) }}
                    className={inputCls + ' text-xs'} />
                </div>
                <div className="text-[#8b5e3c]/40 mt-5">–</div>
                <div>
                  <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Đến ngày</div>
                  <DateInput value={nxtTo} onChange={v => { setNxtTo(v); setNxtPreset('custom'); setNxtLoaded(false) }}
                    className={inputCls + ' text-xs'} />
                </div>
              </div>
              {/* Load button */}
              <button onClick={loadNXT} disabled={nxtLoading}
                className={`${btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed mt-auto`}>
                {nxtLoading ? '⏳ Đang tải...' : '🔄 Tải báo cáo'}
              </button>
            </div>
          </div>

          {/* Results */}
          {nxtLoaded && (
            <div className={`${sectionBox} p-4`}>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#3d1f0a]">
                    Kết quả: <span className="text-[#c8773a]">{filteredNXT.length}</span> mặt hàng
                  </span>
                  {nxtSearch && (
                    <span className="text-xs text-[#8b5e3c]/60">(lọc từ {nxtRows.length})</span>
                  )}
                  {/* Adj status badge */}
                  {adjRefDate && (
                    Object.keys(nxtOpeningAdj).length > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-medium rounded-full">
                          ✅ Đã khai báo tồn đầu {adjRefDate.m}/{adjRefDate.y}
                        </span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded-full">
                          ⚠ Chưa khai báo — đang dùng công thức
                        </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text" placeholder="🔍 Tìm tên / mã SP..." value={nxtSearch}
                    onChange={e => setNxtSearch(e.target.value)}
                    className={inputCls + ' text-xs w-44'} />
                  <button
                    onClick={() => setShowKhaiBao(v => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      showKhaiBao
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-amber-500 text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    📋 {showKhaiBao ? 'Đóng khai báo' : 'Khai báo Tồn đầu'}
                  </button>
                  <button
                    onClick={() => setNxtShowBatch(v => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      nxtShowBatch
                        ? 'bg-[#c8773a] text-white border-[#c8773a]'
                        : 'border-[#c8773a] text-[#c8773a] hover:bg-[#fef4e8]'
                    }`}
                  >
                    📦 {nxtShowBatch ? 'Ẩn lô hàng' : 'Xem theo lô'}
                  </button>
                  <button onClick={() => printNXT(filteredNXT, nxtFrom, nxtTo)} className={btnOutline}>
                    🖨 In
                  </button>
                  <button onClick={exportNXTExcel} className={btnOutline}>
                    📥 Excel
                  </button>
                </div>
              </div>

              {/* ── Panel Khai báo Tồn đầu kỳ ── */}
              {showKhaiBao && adjRefDate && (
                <div className="mb-4 border border-amber-200 rounded-xl bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-900">
                        📋 Khai báo Tồn đầu kỳ — tháng {adjRefDate.m}/{adjRefDate.y}
                      </div>
                      <div className="text-[11px] text-amber-700/70 mt-0.5">
                        Nhập tồn đầu kỳ thủ công cho từng sản phẩm. Ô để trống = dùng công thức tính.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text" placeholder="🔍 Tìm sản phẩm..." value={kbSearch}
                        onChange={e => setKbSearch(e.target.value)}
                        className="border border-amber-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-amber-500 w-44" />
                      {/* Tải file mẫu */}
                      <button
                        onClick={downloadKbTemplate}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50 cursor-pointer"
                      >
                        📥 Tải file mẫu
                      </button>
                      {/* Import Excel */}
                      <input
                        ref={kbImportRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={importKbExcel}
                      />
                      <button
                        onClick={() => kbImportRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-400 text-amber-700 text-xs font-medium hover:bg-amber-50 cursor-pointer"
                      >
                        📤 Import Excel
                      </button>
                      <button
                        onClick={() => saveOpeningAdj(true)}
                        disabled={savingAdj}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-700 disabled:opacity-60 cursor-pointer"
                      >
                        {savingAdj ? '⏳' : '🔄'} Set tất cả = 0
                      </button>
                      <button
                        onClick={() => saveOpeningAdj(false)}
                        disabled={savingAdj}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
                      >
                        {savingAdj ? '⏳ Đang lưu...' : '💾 Lưu khai báo'}
                      </button>
                    </div>
                  </div>

                  {/* Khai báo table */}
                  <div className="overflow-y-auto max-h-80 rounded-lg border border-amber-200">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-amber-100">
                          <th className="border border-amber-200 px-2 py-1.5 text-center w-8">STT</th>
                          <th className="border border-amber-200 px-2 py-1.5 text-left">Tên sản phẩm</th>
                          <th className="border border-amber-200 px-2 py-1.5 text-center w-16">ĐVT</th>
                          <th className="border border-amber-200 px-2 py-1.5 text-right w-40">
                            Tồn đầu khai báo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProducts
                          .filter(p => p.is_active && (
                            kbSearch === '' ||
                            p.name.toLowerCase().includes(kbSearch.toLowerCase()) ||
                            (p.code || '').toLowerCase().includes(kbSearch.toLowerCase())
                          ))
                          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
                          .map((p, i) => {
                            const key = p.name.toLowerCase().trim()
                            const nxtRow = nxtRows.find(r => r.name.toLowerCase().trim() === key)
                            const formulaTonDau = nxtRow ? nxtRow.formulaTonDau : null
                            return (
                              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                                <td className="border border-amber-100 px-2 py-1 text-center text-[#8b5e3c]/50">{i + 1}</td>
                                <td className="border border-amber-100 px-2 py-1 font-medium text-[#1a0f07]">
                                  {p.name}
                                  {p.code && <span className="ml-1 text-[10px] text-[#8b5e3c]/40">{p.code}</span>}
                                </td>
                                <td className="border border-amber-100 px-2 py-1 text-center text-[#8b5e3c]">{p.unit}</td>
                                <td className="border border-amber-100 px-1 py-0.5">
                                  <input
                                    type="number" min={0} step="0.01"
                                    value={nxtOpeningLocal[key] ?? ''}
                                    placeholder={formulaTonDau !== null ? String(formulaTonDau) : '0'}
                                    onChange={e => setNxtOpeningLocal(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full text-right px-2 py-1 rounded border border-amber-200 focus:outline-none focus:border-amber-400 text-xs bg-white"
                                  />
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5e6cc]/60">
                      <th className="border border-[#e8ddd0] px-2 py-2 text-center w-8">STT</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-left">Tên vật tư, hàng hoá</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-center">ĐVT</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right">Tồn đầu kỳ</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-green-50">Nhập trong kỳ</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-orange-50">Xuất trong kỳ</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right font-bold">Tồn cuối kỳ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedNXT.map((r, i) => {
                      const bKey     = r.name.toLowerCase().trim()
                      const batches  = nxtShowBatch ? (nxtBatches[bKey] || []) : []
                      const eff      = (q: number) => parseFloat(q.toFixed(2))
                      const hasBatch = batches.length > 0
                      const globalIdx = (safePage - 1) * NXT_PAGE_SIZE + i
                      return (
                        <React.Fragment key={r.name}>
                          {/* ── Product summary row ── */}
                          <tr className={`${hasBatch && nxtShowBatch ? 'bg-[#fdf4eb]' : i % 2 === 0 ? 'bg-white' : 'bg-[#fdfaf6]'}`}>
                            <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#8b5e3c]/60">{globalIdx + 1}</td>
                            <td className="border border-[#e8ddd0] px-2 py-1.5 font-medium text-[#1a0f07]">
                              {nxtShowBatch && hasBatch && <span className="mr-1 text-[10px] text-[#c8773a]">▼</span>}
                              {r.name}
                              {r.code && <span className="ml-1 text-[10px] text-[#8b5e3c]/50">{r.code}</span>}
                            </td>
                            <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#8b5e3c]">{r.unit}</td>
                            <td className={`border border-[#e8ddd0] px-2 py-1.5 text-right ${
                              r.hasAdj
                                ? 'bg-amber-50 text-amber-900 font-semibold'
                                : r.tonDau < 0
                                  ? 'text-red-600'
                                  : 'text-[#3d1f0a]'
                            }`}>
                              {fmtNum(r.tonDau)}
                              {r.hasAdj && <span className="ml-0.5 text-[9px] text-amber-500">✎</span>}
                            </td>
                            <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-green-700 bg-green-50/50">
                              {r.nhapSL > 0.001 ? fmtNum(r.nhapSL) : <span className="text-[#8b5e3c]/30">—</span>}
                            </td>
                            <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-orange-700 bg-orange-50/50">
                              {r.xuatSL > 0.001 ? fmtNum(r.xuatSL) : <span className="text-[#8b5e3c]/30">—</span>}
                            </td>
                            <td className={`border border-[#e8ddd0] px-2 py-1.5 text-right font-bold ${r.tonCuoi < 0 ? 'text-red-600' : 'text-[#1a0f07]'}`}>
                              {fmtNum(r.tonCuoi)}
                            </td>
                          </tr>

                          {/* ── Batch sub-rows ── */}
                          {nxtShowBatch && batches.map((b) => {
                            const remaining = eff(b.remaining_qty)
                            const qtyUsed   = eff(Math.max(0, b.quantity - b.remaining_qty))
                            const isEmpty   = remaining <= 0
                            const isExpired = b.exp_date ? b.exp_date < todayStr() : false
                            const statusColor = isEmpty ? 'bg-gray-100 text-gray-400' : isExpired ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-700'
                            return (
                              <tr key={`b-${b.id}`} className="bg-[#fdf9f4]">
                                <td className="border border-[#e8ddd0] px-2 py-1 text-center"></td>
                                <td className="border border-[#e8ddd0] px-2 py-1 pl-5">
                                  <span className="text-[#c8773a]/50 mr-1 text-[10px]">↳</span>
                                  <span className="font-mono text-[11px] text-[#c8773a] font-medium">{b.inv_code}</span>
                                  <span className="mx-1.5 text-[#e8ddd0]">·</span>
                                  <span className="text-[10px] text-[#8b5e3c]/70">{fmtDate(b.inv_date)}</span>
                                  {b.exp_date && (
                                    <span className={`ml-1.5 text-[10px] ${isExpired ? 'text-red-500 font-medium' : 'text-[#8b5e3c]/40'}`}>
                                      HH:{fmtDate(b.exp_date)}
                                    </span>
                                  )}
                                  <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColor}`}>
                                    {isEmpty ? 'Hết' : isExpired ? 'Hết hạn' : 'Còn hàng'}
                                  </span>
                                </td>
                                {/* ĐVT */}
                                <td className="border border-[#e8ddd0] px-2 py-1 text-center text-[10px] text-[#8b5e3c]/60">{b.unit}</td>
                                {/* Tồn đầu → empty */}
                                <td className="border border-[#e8ddd0] px-2 py-1"></td>
                                {/* Nhập → số lượng nhập của lô */}
                                <td className="border border-[#e8ddd0] px-2 py-1 text-right text-[11px] text-green-700 bg-green-50/30">
                                  {fmtNum(b.quantity)}
                                </td>
                                {/* Xuất → tổng đã dùng từ lô này */}
                                <td className="border border-[#e8ddd0] px-2 py-1 text-right text-[11px] text-orange-700 bg-orange-50/30">
                                  {qtyUsed > 0.001 ? fmtNum(qtyUsed) : ''}
                                </td>
                                {/* Tồn cuối → remaining */}
                                <td className={`border border-[#e8ddd0] px-2 py-1 text-right text-[11px] font-semibold ${
                                  isEmpty ? 'text-[#8b5e3c]/30' : isExpired ? 'text-red-600' : 'text-[#1a0f07]'
                                }`}>
                                  {remaining > 0 ? fmtNum(remaining) : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                    {/* Total row */}
                    <tr className="bg-[#f5e6cc]/80 font-bold text-[#3d1f0a]">
                      <td colSpan={3} className="border border-[#e8ddd0] px-2 py-2 text-center">TỔNG CỘNG</td>
                      <td className="border border-[#e8ddd0] px-2 py-2"></td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-green-800">{fmtNum(nxtTotals.nhapSL)}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-orange-800">{fmtNum(nxtTotals.xuatSL)}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {nxtTotalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0e4d0]">
                  <span className="text-xs text-[#8b5e3c]/60">
                    Trang <b>{safePage}</b> / {nxtTotalPages}
                    &nbsp;·&nbsp;
                    {filteredNXT.length} mặt hàng
                    &nbsp;·&nbsp;
                    hiển thị {(safePage - 1) * NXT_PAGE_SIZE + 1}–{Math.min(safePage * NXT_PAGE_SIZE, filteredNXT.length)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNxtPage(1)} disabled={safePage === 1}
                      className="px-2 py-1 rounded text-xs border border-[#e8ddd0] disabled:opacity-40 hover:bg-[#f5e6cc] cursor-pointer disabled:cursor-default"
                    >«</button>
                    <button
                      onClick={() => setNxtPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                      className="px-2.5 py-1 rounded text-xs border border-[#e8ddd0] disabled:opacity-40 hover:bg-[#f5e6cc] cursor-pointer disabled:cursor-default"
                    >‹</button>

                    {/* Số trang hiển thị xung quanh trang hiện tại */}
                    {Array.from({ length: nxtTotalPages }, (_, idx) => idx + 1)
                      .filter(p => p === 1 || p === nxtTotalPages || Math.abs(p - safePage) <= 2)
                      .reduce<(number | '…')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, idx) =>
                        p === '…'
                          ? <span key={`e${idx}`} className="px-1 text-xs text-[#8b5e3c]/40">…</span>
                          : <button
                              key={p}
                              onClick={() => setNxtPage(p as number)}
                              className={`px-2.5 py-1 rounded text-xs border cursor-pointer ${
                                safePage === p
                                  ? 'bg-[#c8773a] text-white border-[#c8773a] font-medium'
                                  : 'border-[#e8ddd0] hover:bg-[#f5e6cc] text-[#3d1f0a]'
                              }`}
                            >{p}</button>
                      )}

                    <button
                      onClick={() => setNxtPage(p => Math.min(nxtTotalPages, p + 1))} disabled={safePage === nxtTotalPages}
                      className="px-2.5 py-1 rounded text-xs border border-[#e8ddd0] disabled:opacity-40 hover:bg-[#f5e6cc] cursor-pointer disabled:cursor-default"
                    >›</button>
                    <button
                      onClick={() => setNxtPage(nxtTotalPages)} disabled={safePage === nxtTotalPages}
                      className="px-2 py-1 rounded text-xs border border-[#e8ddd0] disabled:opacity-40 hover:bg-[#f5e6cc] cursor-pointer disabled:cursor-default"
                    >»</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!nxtLoaded && !nxtLoading && (
            <div className={`${sectionBox} p-10 text-center text-[#8b5e3c]/60 text-sm`}>
              Chọn kỳ báo cáo và nhấn <b>Tải báo cáo</b> để xem dữ liệu
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: CHI TIẾT ══════════════════════════════════════ */}
      {tab === 'chitiet' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex flex-wrap items-end gap-3">
              {/* Product selector — autocomplete search */}
              <div className="flex-1 min-w-[240px]">
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1 font-medium">Sản phẩm / vật tư</div>
                <ProductPicker
                  products={allProducts}
                  value={cdProductName}
                  placeholder="🔍 Gõ tên để tìm sản phẩm..."
                  onChange={(name) => {
                    setCdProductName(name)
                    const found = allProducts.find(p => p.is_active && p.name === name)
                    setCdProductId(found?.id ?? null)
                    setCdLoaded(false)
                  }}
                />
              </div>
              {/* Date range */}
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Từ ngày</div>
                <DateInput value={cdFrom} onChange={v => { setCdFrom(v); setCdLoaded(false) }}
                  className={inputCls + ' text-xs'} />
              </div>
              <div className="text-[#8b5e3c]/40 mb-2">–</div>
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Đến ngày</div>
                <DateInput value={cdTo} onChange={v => { setCdTo(v); setCdLoaded(false) }}
                  className={inputCls + ' text-xs'} />
              </div>
              <button onClick={loadChiTiet} disabled={cdLoading || !cdProductId}
                className={`${btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}>
                {cdLoading ? '⏳ Đang tải...' : '🔄 Xem sổ'}
              </button>
            </div>
          </div>

          {/* Ledger table */}
          {cdLoaded && (() => {
            const p = allProducts.find(x => x.id === cdProductId)!
            return (
              <div className={`${sectionBox} p-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-sm font-semibold text-[#3d1f0a]">{p.name}</span>
                    <span className="ml-2 text-xs text-[#8b5e3c]/60">ĐVT: {p.unit}</span>
                    <span className="ml-2 text-xs text-[#8b5e3c]/60">
                      {fmtDate(cdFrom)} → {fmtDate(cdTo)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => printChiTiet(p.name, p.unit, cdRows, cdTonDau, cdFrom, cdTo)} className={btnOutline}>
                      🖨 In sổ chi tiết
                    </button>
                    <button onClick={exportCdExcel} className={btnOutline}>📥 Excel</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f5e6cc]/60">
                        <th className="border border-[#e8ddd0] px-2 py-2 text-center">Ngày</th>
                        <th className="border border-[#e8ddd0] px-2 py-2 text-center">Số CT</th>
                        <th className="border border-[#e8ddd0] px-2 py-2 text-left">Diễn giải</th>
                        <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-green-50">Nhập</th>
                        <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-orange-50">Xuất</th>
                        <th className="border border-[#e8ddd0] px-2 py-2 text-right font-bold">Tồn lũy kế</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Opening balance row */}
                      <tr className="bg-[#fdf6ec] italic text-[#8b5e3c]">
                        <td colSpan={5} className="border border-[#e8ddd0] px-2 py-1.5 text-center">— Tồn đầu kỳ —</td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right font-bold text-[#1a0f07]">{fmtNum(cdTonDau)}</td>
                      </tr>
                      {cdRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="border border-[#e8ddd0] px-2 py-4 text-center text-[#8b5e3c]/50">
                            Không có giao dịch trong kỳ này
                          </td>
                        </tr>
                      )}
                      {cdRows.map((r, i) => (
                        <tr key={`${r.id}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fdfaf6]'}>
                          <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#8b5e3c]">{fmtDate(r.ngay)}</td>
                          <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#c8773a] font-mono text-[11px]">{r.code}</td>
                          <td className="border border-[#e8ddd0] px-2 py-1.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                              r.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {r.type === 'in' ? 'Nhập' : 'Xuất'}
                            </span>
                            {r.partner && <span className="text-[#8b5e3c]">{r.partner}</span>}
                          </td>
                          <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-green-700 bg-green-50/40">
                            {r.nhap > 0.001 ? fmtNum(r.nhap) : ''}
                          </td>
                          <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-orange-700 bg-orange-50/40">
                            {r.xuat > 0.001 ? fmtNum(r.xuat) : ''}
                          </td>
                          <td className={`border border-[#e8ddd0] px-2 py-1.5 text-right font-bold ${r.ton < 0 ? 'text-red-600' : 'text-[#1a0f07]'}`}>
                            {fmtNum(r.ton)}
                          </td>
                        </tr>
                      ))}
                      {/* Closing balance */}
                      {cdRows.length > 0 && (
                        <tr className="bg-[#f5e6cc]/80 font-bold text-[#3d1f0a]">
                          <td colSpan={5} className="border border-[#e8ddd0] px-2 py-2 text-center">Tồn cuối kỳ</td>
                          <td className="border border-[#e8ddd0] px-2 py-2 text-right">
                            {fmtNum(cdRows[cdRows.length - 1].ton)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          {!cdLoaded && !cdLoading && (
            <div className={`${sectionBox} p-10 text-center text-[#8b5e3c]/60 text-sm`}>
              Chọn sản phẩm và khoảng thời gian, nhấn <b>Xem sổ</b>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: KIỂM KÊ ═══════════════════════════════════════ */}
      {tab === 'kiekem' && (
        <div className="space-y-4">
          {/* Control bar */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1 font-medium">Ngày kiểm kê</div>
                <DateInput value={kkDate} onChange={v => setKkDate(v)}
                  className={inputCls + ' text-sm'} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1 font-medium">Tìm sản phẩm</div>
                <input type="text" placeholder="🔍 Tên hoặc mã SP..." value={kkSearch}
                  onChange={e => setKkSearch(e.target.value)} className={inputCls + ' w-full text-sm'} />
              </div>
              {kkDiffCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                  ⚠ {kkDiffCount} mặt hàng chênh lệch
                </div>
              )}
            </div>

            {/* Print buttons */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f0e4d0]">
              <button onClick={() => printKiemKe05VT(kkProducts, kkActual, kkDate)} className={btnPrimary}>
                🖨 In Mẫu 05-VT (Biên bản KK)
              </button>
              <button onClick={() => printTongHopKiemKe(kkProducts, kkActual, kkDate)} className={btnOutline}>
                🖨 In Tổng hợp kết quả
              </button>
              <button
                onClick={() => printXuLyChenhLech(kkProducts, kkActual, kkDate)}
                disabled={kkDiffCount === 0}
                className={`${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                🖨 In Biên bản xử lý chênh lệch
              </button>
              <button onClick={exportKkExcel} className={btnOutline}>📥 Xuất Excel</button>
            </div>
          </div>

          {/* Inventory count table */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#3d1f0a]">
                {kkProducts.length} sản phẩm
                {kkSearch && <span className="text-xs text-[#8b5e3c]/60 ml-1">(đang lọc)</span>}
              </span>
              <span className="text-xs text-[#8b5e3c]/60">Nhập số thực tế vào cột màu vàng</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f5e6cc]/60">
                    <th className="border border-[#e8ddd0] px-2 py-2 text-center w-8">STT</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-left">Tên vật tư, hàng hoá</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-center">ĐVT</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-right">Tồn sổ sách</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-amber-50">Tồn thực tế ✏</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-right">Chênh lệch</th>
                    <th className="border border-[#e8ddd0] px-2 py-2 text-right">CL × Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {kkProducts.map((p, i) => {
                    const actual = kkActual.has(p.id) ? kkActual.get(p.id)! : p.stock_qty
                    const diff   = actual - p.stock_qty
                    const hasDiff = Math.abs(diff) > 0.001
                    return (
                      <tr key={p.id} className={hasDiff ? 'bg-amber-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-[#fdfaf6]'}>
                        <td className="border border-[#e8ddd0] px-2 py-1 text-center text-[#8b5e3c]/60">{i + 1}</td>
                        <td className="border border-[#e8ddd0] px-2 py-1 font-medium text-[#1a0f07]">
                          {p.name}
                          {p.code && <span className="ml-1 text-[10px] text-[#8b5e3c]/50">{p.code}</span>}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1 text-center text-[#8b5e3c]">{p.unit}</td>
                        <td className="border border-[#e8ddd0] px-2 py-1 text-right text-[#3d1f0a]">{fmtNum(p.stock_qty)}</td>
                        <td className="border border-[#e8ddd0] px-1 py-0.5 bg-amber-50">
                          <input
                            type="number"
                            min={0} step="0.01"
                            value={kkActual.has(p.id) ? kkActual.get(p.id) : p.stock_qty}
                            onChange={e => {
                              const val = parseFloat(e.target.value)
                              setKkActual(prev => {
                                const next = new Map(prev)
                                if (isNaN(val)) next.delete(p.id)
                                else next.set(p.id, val)
                                return next
                              })
                            }}
                            className="w-full text-right px-2 py-1 rounded border border-amber-200 focus:outline-none focus:border-amber-400 text-xs bg-white"
                          />
                        </td>
                        <td className={`border border-[#e8ddd0] px-2 py-1 text-right font-medium ${
                          hasDiff ? (diff > 0 ? 'text-green-700' : 'text-red-700') : 'text-[#8b5e3c]/40'
                        }`}>
                          {hasDiff ? `${diff > 0 ? '+' : ''}${fmtNum(diff)}` : '—'}
                        </td>
                        <td className={`border border-[#e8ddd0] px-2 py-1 text-right ${
                          hasDiff ? (diff > 0 ? 'text-green-700' : 'text-red-700') : 'text-[#8b5e3c]/40'
                        }`}>
                          {hasDiff && p.cost_price
                            ? Number(diff * p.cost_price).toLocaleString('vi-VN')
                            : '—'
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: CÔNG NỢ NHẬP ══════════════════════════════════ */}
      {tab === 'congno' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1.5 font-medium">Kỳ báo cáo</div>
                <div className="flex flex-wrap gap-1">
                  {PRESETS.map(pr => (
                    <button
                      key={pr.key}
                      onClick={() => applyCnPreset(pr.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        cnPreset === pr.key
                          ? 'bg-[#c8773a] text-white'
                          : 'bg-[#f5e6cc] text-[#8b5e3c] hover:bg-[#e8d5b7]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Từ ngày</div>
                  <DateInput value={cnFrom} onChange={v => { setCnFrom(v); setCnPreset('custom'); setCnLoaded(false) }}
                    className={inputCls + ' text-xs'} />
                </div>
                <div className="text-[#8b5e3c]/40 mt-5">–</div>
                <div>
                  <div className="text-[11px] text-[#8b5e3c]/60 mb-1">Đến ngày</div>
                  <DateInput value={cnTo} onChange={v => { setCnTo(v); setCnPreset('custom'); setCnLoaded(false) }}
                    className={inputCls + ' text-xs'} />
                </div>
              </div>
              <button onClick={loadCongNo} disabled={cnLoading}
                className={`${btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed mt-auto`}>
                {cnLoading ? '⏳ Đang tải...' : '🔄 Tải công nợ'}
              </button>
            </div>
          </div>

          {/* Results */}
          {cnLoaded && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Tổng tiền nhập',  value: cnTotals.total,  color: '#3d1f0a', icon: '🧾' },
                  { label: 'Đã thanh toán',   value: cnTotals.paid,   color: '#1e7a4a', icon: '✅' },
                  { label: 'Còn nợ',          value: cnTotals.unpaid, color: '#d94f3d', icon: '⏳' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 border-[1.5px] border-[#f5e6cc] flex items-center gap-3">
                    <div className="text-2xl">{s.icon}</div>
                    <div>
                      <div className="text-lg font-bold" style={{ color: s.color }}>{fmtPrice(s.value)}</div>
                      <div className="text-[11px] text-[#8b5e3c]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${sectionBox} p-4`}>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold text-[#3d1f0a]">
                    Công nợ theo NCC — <span className="text-[#c8773a]">{filteredCnSuppliers.length}</span> nhà cung cấp
                  </span>
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Filter trạng thái */}
                    <div className="flex gap-1 bg-[#f5e6cc]/50 p-0.5 rounded-lg">
                      {([['all','Tất cả'],['unpaid','Còn nợ'],['paid','Đã trả']] as const).map(([k, lbl]) => (
                        <button key={k} onClick={() => setCnFilter(k)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                            cnFilter === k ? 'bg-white text-[#c8773a] shadow-sm' : 'text-[#8b5e3c]/70 hover:text-[#3d1f0a]'
                          }`}>{lbl}</button>
                      ))}
                    </div>
                    <input
                      type="text" placeholder="🔍 Tìm NCC..." value={cnSearch}
                      onChange={e => setCnSearch(e.target.value)}
                      className={inputCls + ' text-xs w-40'} />
                    <button onClick={exportCnExcel} className={btnOutline}>📥 Excel</button>
                  </div>
                </div>

                {filteredCnSuppliers.length === 0 ? (
                  <div className="py-10 text-center text-[#8b5e3c]/60 text-sm">Không có công nợ phù hợp</div>
                ) : (
                  <div className="space-y-2">
                    {filteredCnSuppliers.map(sup => {
                      const expanded = cnExpanded.has(sup.partner)
                      const visInvs = (sup as DebtSupplier & { _visibleInvoices: DebtInvoice[] })._visibleInvoices
                      return (
                        <div key={sup.partner} className="border border-[#f0e4d0] rounded-xl overflow-hidden">
                          {/* Supplier header row */}
                          <button
                            onClick={() => toggleCnExpand(sup.partner)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-[#fdf6ec] hover:bg-[#fbeedd] transition-colors text-left cursor-pointer"
                          >
                            <span className={`text-[#c8773a] text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                            <span className="font-semibold text-[#3d1f0a] flex-1 min-w-0 truncate">🏭 {sup.partner}</span>
                            <span className="text-xs text-[#8b5e3c] hidden sm:inline">{sup.invoiceCount} HĐ</span>
                            <span className="text-xs text-[#3d1f0a]">Tổng: <b>{fmtPrice(sup.totalAmount)}</b></span>
                            <span className="text-xs text-[#1e7a4a]">Đã trả: <b>{fmtPrice(sup.paidAmount)}</b></span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              sup.unpaidAmount > 0.5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                            }`}>
                              {sup.unpaidAmount > 0.5 ? `Còn nợ ${fmtPrice(sup.unpaidAmount)}` : '✓ Đã thanh toán đủ'}
                            </span>
                          </button>

                          {/* Invoice detail rows */}
                          {expanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-[#f5e6cc]/40 text-[#8b5e3c]">
                                    <th className="px-3 py-2 text-left font-medium">Mã HĐ</th>
                                    <th className="px-3 py-2 text-center font-medium">Ngày nhập</th>
                                    <th className="px-3 py-2 text-right font-medium">Số tiền</th>
                                    <th className="px-3 py-2 text-left font-medium">Ghi chú</th>
                                    <th className="px-3 py-2 text-center font-medium">Bill</th>
                                    <th className="px-3 py-2 text-center font-medium w-44">Thanh toán</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visInvs.map((inv, i) => (
                                    <tr key={inv.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fdfaf6]'}>
                                      <td className="px-3 py-2 font-mono text-[#c8773a] border-t border-[#f0e8d8]">{inv.code}</td>
                                      <td className="px-3 py-2 text-center text-[#8b5e3c] border-t border-[#f0e8d8]">{fmtDate(inv.inv_date)}</td>
                                      <td className="px-3 py-2 text-right font-semibold text-[#3d1f0a] border-t border-[#f0e8d8]">{fmtPrice(inv.total)}</td>
                                      <td className="px-3 py-2 text-[#8b5e3c] max-w-[160px] truncate border-t border-[#f0e8d8]">{inv.note || '—'}</td>
                                      <td className="px-3 py-2 text-center border-t border-[#f0e8d8]">
                                        {inv.payment_bill_url ? (
                                          <button onClick={() => setViewBillUrl(inv.payment_bill_url)}
                                            className="text-[#c8773a] hover:underline cursor-pointer">🧾 Xem</button>
                                        ) : <span className="text-[#ddd]">—</span>}
                                      </td>
                                      <td className="px-3 py-2 text-center border-t border-[#f0e8d8]">
                                        {inv.paid ? (
                                          <div className="flex items-center justify-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-medium">
                                              ✅ Đã TT
                                            </span>
                                            <button onClick={() => unmarkPaid(inv)}
                                              title="Bỏ đánh dấu thanh toán"
                                              className="text-[#aaa] hover:text-red-500 text-xs cursor-pointer">↩</button>
                                          </div>
                                        ) : (
                                          <button onClick={() => openPayModal(inv)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1e7a4a] text-white text-[11px] font-medium hover:opacity-90 cursor-pointer">
                                            ✓ Đánh dấu đã TT
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {!cnLoaded && !cnLoading && (
            <div className={`${sectionBox} p-10 text-center text-[#8b5e3c]/60 text-sm`}>
              Chọn kỳ báo cáo và nhấn <b>Tải công nợ</b> để xem dữ liệu
            </div>
          )}
        </div>
      )}

      {/* ─── Modal xác nhận thanh toán + đính kèm bill ─── */}
      {payModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !savingPay && setPayModalInv(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#3d1f0a] mb-1">💳 Xác nhận thanh toán</h3>
            <p className="text-xs text-[#8b5e3c] mb-4">
              Hoá đơn <b className="text-[#c8773a]">{payModalInv.code}</b> — {payModalInv.partner}
              <br/>Số tiền: <b className="text-[#3d1f0a]">{fmtPrice(payModalInv.total)}</b>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8b5e3c] mb-1.5">Đính kèm bill thanh toán (tuỳ chọn)</label>
              <ImageUpload value={payBillUrl} onChange={setPayBillUrl} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPayModalInv(null)} disabled={savingPay}
                className="px-4 py-2 rounded-lg border border-[#f5e6cc] text-[#8b5e3c] text-sm hover:bg-[#fdf6ec] cursor-pointer disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={confirmPay} disabled={savingPay}
                className="px-4 py-2 rounded-lg bg-[#1e7a4a] text-white text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50">
                {savingPay ? '⏳ Đang lưu...' : '✓ Xác nhận đã thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: TỔNG HỢP XNT ═══════════════════════════════════ */}
      {tab === 'tonghop' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className={`${sectionBox} p-4`}>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <div className="text-[11px] text-[#8b5e3c]/60 mb-1.5 font-medium">Kỳ báo cáo</div>
                <div className="flex items-center gap-2">
                  <select value={thMonth} onChange={e => { setThMonth(Number(e.target.value)); setThLoaded(false) }}
                    className={inputCls + ' text-xs w-28'}>
                    {Array.from({length:12},(_,i)=>i+1).map(m=>(
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                  <select value={thYear} onChange={e => { setThYear(Number(e.target.value)); setThLoaded(false) }}
                    className={inputCls + ' text-xs w-24'}>
                    {Array.from({length:6},(_,i)=>new Date().getFullYear()-i).map(y=>(
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <button onClick={loadTongHop} disabled={thLoading}
                    className={`${btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}>
                    {thLoading ? '⏳ Đang tải...' : '🔄 Tải báo cáo'}
                  </button>
                </div>
              </div>
              {thLoaded && (
                <div className="flex items-center gap-2 ml-auto">
                  <input value={thSearch} onChange={e=>setThSearch(e.target.value)} placeholder="Tìm sản phẩm..."
                    className={inputCls + ' text-xs w-48'} />
                  <button onClick={exportTongHopExcel} className={btnOutline}>⬇ Excel</button>
                </div>
              )}
            </div>
          </div>

          {thLoaded && (() => {
            const q = thSearch.toLowerCase()
            const filtered = thSearch
              ? thRows.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
              : thRows

            const totals = filtered.reduce((s,r)=>({
              giaTriTonDau:  s.giaTriTonDau  + r.giaTriTonDau,
              giaTriNhap:    s.giaTriNhap    + r.giaTriNhap,
              giaTriXuat:    s.giaTriXuat    + r.giaTriXuat,
              giaTriTonCuoi: s.giaTriTonCuoi + r.giaTriTonCuoi,
            }), { giaTriTonDau:0, giaTriNhap:0, giaTriXuat:0, giaTriTonCuoi:0 })

            const hetHang = filtered.filter(r=>r.trangThai==='het').length
            const sapHet  = filtered.filter(r=>r.trangThai==='sap_het').length

            return (
              <div className={`${sectionBox} p-4 space-y-4`}>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Tổng GT tồn cuối', val: fmtPrice(totals.giaTriTonCuoi), color: '#c8773a' },
                    { label: 'Tổng GT nhập kỳ',  val: fmtPrice(totals.giaTriNhap),    color: '#1e7a4a' },
                    { label: 'Tổng GT xuất kỳ',  val: fmtPrice(totals.giaTriXuat),    color: '#6d4c2a' },
                    { label: 'Cảnh báo tồn kho', val: `🔴 ${hetHang} hết · 🟡 ${sapHet} sắp hết`, color: '#b45309' },
                  ].map(s=>(
                    <div key={s.label} className="bg-white rounded-xl border border-[#f5e6cc] p-3">
                      <div className="text-[11px] text-[#8b5e3c]/70 mb-1">{s.label}</div>
                      <div className="text-sm font-bold" style={{color:s.color}}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#f5e6cc]">
                  <table className="w-full text-xs border-collapse min-w-[1400px]">
                    <colgroup>
                      <col style={{width:'40px'}}/>
                      <col style={{width:'100px'}}/>
                      <col style={{width:'220px'}}/>
                      <col style={{width:'55px'}}/>
                      <col style={{width:'110px'}}/>
                      <col style={{width:'80px'}}/><col style={{width:'120px'}}/>
                      <col style={{width:'80px'}}/><col style={{width:'120px'}}/>
                      <col style={{width:'80px'}}/><col style={{width:'120px'}}/>
                      <col style={{width:'80px'}}/><col style={{width:'120px'}}/>
                      <col style={{width:'80px'}}/>
                      <col style={{width:'100px'}}/>
                    </colgroup>
                    <thead>
                      <tr className="bg-[#3d1f0a] text-white">
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20] text-center">STT</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20]">Mã SP</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20]">Tên hàng hóa</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20] text-center">ĐVT</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20] text-right">Đơn giá nhập (₫)</th>
                        <th colSpan={2} className="py-1.5 px-3 font-semibold border border-[#5a3a20] text-center">TỒN ĐẦU KỲ</th>
                        <th colSpan={2} className="py-1.5 px-3 font-semibold border border-[#5a3a20] text-center">TỔNG NHẬP</th>
                        <th colSpan={2} className="py-1.5 px-3 font-semibold border border-[#5a3a20] text-center">TỔNG XUẤT</th>
                        <th colSpan={2} className="py-1.5 px-3 font-semibold border border-[#5a3a20] text-center">TỒN CUỐI KỲ</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20] text-center">Tồn<br/>tối thiểu</th>
                        <th rowSpan={2} className="py-2 px-3 font-semibold border border-[#5a3a20] text-center">Trạng thái</th>
                      </tr>
                      <tr className="text-[10px] bg-[#4a2810] text-white/80">
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-center">Số lượng</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-right">Giá trị (₫)</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-center">Số lượng</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-right">Giá trị (₫)</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-center">Số lượng</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-right">Giá trị (₫)</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-center">Số lượng</th>
                        <th className="py-1.5 px-3 border border-[#5a3a20] text-right">Giá trị (₫)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => {
                        const statusBadge =
                          r.trangThai === 'het'     ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium text-[10px]">🔴 HẾT HÀNG</span> :
                          r.trangThai === 'sap_het' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium text-[10px]">🟡 SẮP HẾT</span> :
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium text-[10px]">🟢 ĐỦ HÀNG</span>
                        const rowBg = i%2===0 ? 'bg-white' : 'bg-[#fffdf9]'
                        return (
                          <tr key={r.name} className={`${rowBg} hover:bg-[#fef4e8] transition-colors`}>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center text-[#8b5e3c]/60">{i+1}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] font-mono text-[10px] text-[#8b5e3c]">{r.code}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] font-medium text-[#1a0f07]">{r.name}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center text-[#8b5e3c]">{r.unit}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-right text-[#8b5e3c]">{r.donGia > 0 ? fmtPrice(r.donGia) : '—'}</td>
                            {/* Tồn đầu */}
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center font-medium text-[#1a0f07]">{fmtNum(r.tonDauSL)}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-right text-[#3d1f0a]">{r.giaTriTonDau > 0 ? fmtPrice(r.giaTriTonDau) : '—'}</td>
                            {/* Nhập */}
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center font-medium text-[#1a0f07]">{r.nhapSL > 0.001 ? fmtNum(r.nhapSL) : '—'}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-right text-[#3d1f0a]">{r.giaTriNhap > 0 ? fmtPrice(r.giaTriNhap) : '—'}</td>
                            {/* Xuất */}
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center font-medium text-[#1a0f07]">{r.xuatSL > 0.001 ? fmtNum(r.xuatSL) : '—'}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-right text-[#3d1f0a]">{r.giaTriXuat > 0 ? fmtPrice(r.giaTriXuat) : '—'}</td>
                            {/* Tồn cuối */}
                            <td className={`py-2 px-3 border border-[#f0e8d8] text-center font-bold ${r.tonCuoiSL < 0 ? 'text-red-600' : 'text-[#1a0f07]'}`}>{fmtNum(r.tonCuoiSL)}</td>
                            <td className={`py-2 px-3 border border-[#f0e8d8] text-right font-bold ${r.tonCuoiSL < 0 ? 'text-red-600' : 'text-[#3d1f0a]'}`}>{r.giaTriTonCuoi > 0 ? fmtPrice(r.giaTriTonCuoi) : r.tonCuoiSL < 0 ? fmtPrice(r.giaTriTonCuoi) : '—'}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center text-[#8b5e3c]">{r.tonToiThieu > 0 ? fmtNum(r.tonToiThieu) : '—'}</td>
                            <td className="py-2 px-3 border border-[#f0e8d8] text-center">{statusBadge}</td>
                          </tr>
                        )
                      })}
                      {/* Footer totals */}
                      <tr className="bg-[#3d1f0a] text-white font-semibold text-xs">
                        <td colSpan={5} className="py-2.5 px-3 border border-[#5a3a20] text-center">TỔNG CỘNG ({filtered.length} mặt hàng)</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-center">—</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-right">{fmtPrice(totals.giaTriTonDau)}</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-center">—</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-right">{fmtPrice(totals.giaTriNhap)}</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-center">—</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-right">{fmtPrice(totals.giaTriXuat)}</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-center">—</td>
                        <td className="py-2.5 px-3 border border-[#5a3a20] text-right">{fmtPrice(totals.giaTriTonCuoi)}</td>
                        <td colSpan={2} className="py-2.5 px-3 border border-[#5a3a20] text-center text-amber-300">🔴 {hetHang} · 🟡 {sapHet}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

          {!thLoaded && !thLoading && (
            <div className={`${sectionBox} p-10 text-center text-[#8b5e3c]/60 text-sm`}>
              Chọn tháng/năm và nhấn <b>Tải báo cáo</b> để xem tổng hợp nhập xuất tồn kho
            </div>
          )}
        </div>
      )}

      {/* ─── Modal xem bill ─── */}
      {viewBillUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setViewBillUrl(null)}>
          <div className="relative max-w-2xl max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <img src={viewBillUrl} alt="Bill thanh toán" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <button onClick={() => setViewBillUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[#3d1f0a] font-bold shadow-lg hover:bg-[#fdf6ec] cursor-pointer">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
