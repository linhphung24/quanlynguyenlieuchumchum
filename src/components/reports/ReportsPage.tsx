'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Invoice } from '@/types'
import { fmtNum, fmtPrice, fmtDate, todayStr } from '@/lib/utils'
import DateInput from '@/components/shared/DateInput'
import ProductPicker from '@/components/shared/ProductPicker'
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
type TabKey = 'nxt' | 'chitiet' | 'kiekem'
type PeriodPreset = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface NXTRow {
  code: string; name: string; unit: string; donGia: number
  tonDau: number; nhapSL: number; nhapTien: number
  xuatSL: number; xuatTien: number; tonCuoi: number; tonCuoiTien: number
}
interface LedgerRow {
  id: number; ngay: string; code: string; type: 'in' | 'out'
  partner: string; nhap: number; xuat: number; ton: number; price: number
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
  const tNhapSL   = rows.reduce((s, r) => s + r.nhapSL,   0)
  const tNhapTien = rows.reduce((s, r) => s + r.nhapTien, 0)
  const tXuatSL   = rows.reduce((s, r) => s + r.xuatSL,   0)
  const tXuatTien = rows.reduce((s, r) => s + r.xuatTien, 0)
  const tCuoiTien = rows.reduce((s, r) => s + r.tonCuoiTien, 0)

  const bodyRows = rows.map((r, i) => `<tr>
    <td class="ctr">${i + 1}</td>
    <td class="ctr">${r.code || ''}</td>
    <td>${r.name}</td>
    <td class="ctr">${r.unit}</td>
    <td class="num">${fmtNum(r.tonDau)}</td>
    <td class="num">${r.nhapSL > 0.001 ? fmtNum(r.nhapSL) : ''}</td>
    <td class="num">${r.nhapTien > 0.1 ? Number(r.nhapTien).toLocaleString('vi-VN') : ''}</td>
    <td class="num">${r.xuatSL > 0.001 ? fmtNum(r.xuatSL) : ''}</td>
    <td class="num">${r.xuatTien > 0.1 ? Number(r.xuatTien).toLocaleString('vi-VN') : ''}</td>
    <td class="num" style="font-weight:bold">${fmtNum(r.tonCuoi)}</td>
    <td class="num">${r.tonCuoiTien > 0.1 ? Number(r.tonCuoiTien).toLocaleString('vi-VN') : ''}</td>
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
        <th rowspan="2">STT</th><th rowspan="2">Mã SP</th>
        <th rowspan="2">Tên vật tư, hàng hoá</th><th rowspan="2">ĐVT</th>
        <th rowspan="2">Tồn đầu kỳ</th>
        <th colspan="2">Nhập trong kỳ</th>
        <th colspan="2">Xuất trong kỳ</th>
        <th colspan="2">Tồn cuối kỳ</th>
      </tr>
      <tr>
        <th>Số lượng</th><th>Thành tiền</th>
        <th>Số lượng</th><th>Thành tiền</th>
        <th>Số lượng</th><th>Thành tiền (₫)</th>
      </tr>
      <tr style="font-style:italic;font-size:10px">
        <td class="ctr">A</td><td class="ctr">B</td><td class="ctr">C</td><td class="ctr">D</td>
        <td class="ctr">1</td><td class="ctr">2</td><td class="ctr">3</td>
        <td class="ctr">4</td><td class="ctr">5</td><td class="ctr">6</td><td class="ctr">7</td>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
      <tr class="total-row">
        <td colspan="4" class="ctr">CỘNG</td>
        <td></td>
        <td class="num">${fmtNum(tNhapSL)}</td>
        <td class="num">${Number(tNhapTien).toLocaleString('vi-VN')}</td>
        <td class="num">${fmtNum(tXuatSL)}</td>
        <td class="num">${Number(tXuatTien).toLocaleString('vi-VN')}</td>
        <td></td>
        <td class="num">${Number(tCuoiTien).toLocaleString('vi-VN')}</td>
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
  const { sb, allProducts, toast } = useApp()

  // ── tab ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabKey>('nxt')

  // ── NXT state ────────────────────────────────────────────────
  const [nxtPreset,  setNxtPreset]  = useState<PeriodPreset>('month')
  const [nxtFrom,    setNxtFrom]    = useState(getRangeForPreset('month')[0])
  const [nxtTo,      setNxtTo]      = useState(getRangeForPreset('month')[1])
  const [nxtRows,    setNxtRows]    = useState<NXTRow[]>([])
  const [nxtLoading, setNxtLoading] = useState(false)
  const [nxtLoaded,  setNxtLoaded]  = useState(false)
  const [nxtSearch,  setNxtSearch]  = useState('')

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
      const [{ data: pData }, { data: postData }] = await Promise.all([
        sb.from('invoices').select('*').gte('inv_date', nxtFrom).lte('inv_date', nxtTo),
        sb.from('invoices').select('*').gt('inv_date', nxtTo),
      ])

      const periodInvs = (pData    || []) as Invoice[]
      const postInvs   = (postData || []) as Invoice[]

      // ── FIFO xuất tiền: lấy từ batch_deductions × batch_price ──
      // (chính xác hơn dùng giá ghi trên HĐ xuất)
      const fifoXuatTien: Record<string, number> = {}
      const periodOutIds = periodInvs.filter(inv => inv.type === 'out').map(inv => inv.id)
      if (periodOutIds.length > 0) {
        const { data: deductData } = await sb
          .from('batch_deductions')
          .select('qty_used, batch_price, batches!batch_id(product_name)')
          .in('inv_id', periodOutIds)
        for (const d of (deductData || []) as {
          qty_used: number; batch_price: number
          batches: { product_name: string } | null
        }[]) {
          const pName = d.batches?.product_name
          if (!pName) continue
          const key = pName.toLowerCase().trim()
          fifoXuatTien[key] = (fifoXuatTien[key] || 0) + d.qty_used * d.batch_price
        }
      }

      // ── SL map (dùng cho tonDau/tonCuoi + nhapTien) ──────────
      type PMap = Record<string, { nhapSL: number; nhapTien: number; xuatSL: number }>
      const periodMap: PMap = {}
      const postMap:   PMap = {}

      const addInv = (map: PMap, invs: Invoice[]) => {
        for (const inv of invs) {
          for (const it of (inv.items as { name?: string; amount?: number; price?: number }[])) {
            if (!it.name) continue
            const key = it.name.toLowerCase().trim()
            if (!map[key]) map[key] = { nhapSL: 0, nhapTien: 0, xuatSL: 0 }
            const amt   = Number(it.amount) || 0
            const price = Number(it.price)  || 0
            if (inv.type === 'in') { map[key].nhapSL += amt; map[key].nhapTien += amt * price }
            else                   { map[key].xuatSL += amt }
          }
        }
      }

      addInv(periodMap, periodInvs)
      addInv(postMap,   postInvs)

      const rows: NXTRow[] = []
      for (const p of allProducts.filter(p => p.is_active)) {
        const key  = p.name.toLowerCase().trim()
        const per  = periodMap[key] || { nhapSL: 0, nhapTien: 0, xuatSL: 0 }
        const post = postMap[key]   || { nhapSL: 0, nhapTien: 0, xuatSL: 0 }

        // tonCuoi of period = current stock_qty corrected by post-period movements
        const tonCuoi = p.stock_qty - post.nhapSL + post.xuatSL
        const tonDau  = tonCuoi - per.nhapSL + per.xuatSL

        // Skip rows with no activity AND zero stock throughout
        if (Math.abs(tonDau) < 0.001 && per.nhapSL === 0 && per.xuatSL === 0 && Math.abs(tonCuoi) < 0.001) continue

        rows.push({
          code: p.code || '', name: p.name, unit: p.unit, donGia: p.cost_price || 0,
          tonDau, nhapSL: per.nhapSL, nhapTien: per.nhapTien,
          xuatSL: per.xuatSL,
          xuatTien: fifoXuatTien[key] || 0,   // ← giá vốn FIFO từ batch_deductions
          tonCuoi,
          tonCuoiTien: Math.max(0, tonCuoi) * (p.cost_price || 0),
        })
      }

      rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setNxtRows(rows); setNxtLoaded(true)
    } catch (e) {
      toast('Lỗi tải báo cáo: ' + (e as Error).message, 'error')
    } finally {
      setNxtLoading(false)
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

  // ── NXT filtered ─────────────────────────────────────────────
  const filteredNXT = useMemo(() => {
    if (!nxtSearch) return nxtRows
    const q = nxtSearch.toLowerCase()
    return nxtRows.filter(r =>
      r.name.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q)
    )
  }, [nxtRows, nxtSearch])

  const nxtTotals = useMemo(() => ({
    nhapSL:      filteredNXT.reduce((s, r) => s + r.nhapSL,      0),
    nhapTien:    filteredNXT.reduce((s, r) => s + r.nhapTien,    0),
    xuatSL:      filteredNXT.reduce((s, r) => s + r.xuatSL,      0),
    xuatTien:    filteredNXT.reduce((s, r) => s + r.xuatTien,    0),
    tonCuoiTien: filteredNXT.reduce((s, r) => s + r.tonCuoiTien, 0),
  }), [filteredNXT])

  // ── Excel export NXT ─────────────────────────────────────────
  const exportNXTExcel = () => {
    const header = ['STT','Mã SP','Tên vật tư','ĐVT','Tồn đầu kỳ','Nhập SL','Nhập tiền','Xuất SL','Xuất tiền','Tồn cuối kỳ','Giá trị tồn']
    const data   = filteredNXT.map((r, i) => [
      i + 1, r.code, r.name, r.unit,
      r.tonDau, r.nhapSL, r.nhapTien, r.xuatSL, r.xuatTien, r.tonCuoi, r.tonCuoiTien,
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

  // ── Shared UI atoms ──────────────────────────────────────────
  const sectionBox = 'bg-[#fffaf4] rounded-2xl border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]'
  const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium hover:opacity-90 transition-all cursor-pointer'
  const btnOutline = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c8773a] text-[#c8773a] text-xs font-medium hover:bg-[#fef4e8] transition-all cursor-pointer'
  const inputCls  = 'border border-[#e8ddd0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c8773a] focus:ring-1 focus:ring-[#c8773a]/20'

  const TABS = [
    { key: 'nxt'    as TabKey, label: '📊 Nhập-Xuất-Tồn' },
    { key: 'chitiet' as TabKey, label: '📋 Sổ chi tiết' },
    { key: 'kiekem'  as TabKey, label: '🔍 Kiểm kê định kỳ' },
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#3d1f0a]">
                    Kết quả: <span className="text-[#c8773a]">{filteredNXT.length}</span> mặt hàng
                  </span>
                  {nxtSearch && (
                    <span className="text-xs text-[#8b5e3c]/60">(lọc từ {nxtRows.length})</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text" placeholder="🔍 Tìm tên / mã SP..." value={nxtSearch}
                    onChange={e => setNxtSearch(e.target.value)}
                    className={inputCls + ' text-xs w-48'} />
                  <button onClick={() => printNXT(filteredNXT, nxtFrom, nxtTo)} className={btnOutline}>
                    🖨 In báo cáo
                  </button>
                  <button onClick={exportNXTExcel} className={btnOutline}>
                    📥 Xuất Excel
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5e6cc]/60">
                      <th className="border border-[#e8ddd0] px-2 py-2 text-center w-8">STT</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-left">Tên vật tư, hàng hoá</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-center">ĐVT</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right">Tồn đầu kỳ</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-green-50">Nhập SL</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-green-50">Nhập tiền</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-orange-50">Xuất SL</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right bg-orange-50">Xuất tiền</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right font-bold">Tồn cuối kỳ</th>
                      <th className="border border-[#e8ddd0] px-2 py-2 text-right">Giá trị tồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNXT.map((r, i) => (
                      <tr key={r.name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fdfaf6]'}>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#8b5e3c]/60">{i + 1}</td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 font-medium text-[#1a0f07]">
                          {r.name}
                          {r.code && <span className="ml-1 text-[10px] text-[#8b5e3c]/50">{r.code}</span>}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-center text-[#8b5e3c]">{r.unit}</td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-[#3d1f0a]">{fmtNum(r.tonDau)}</td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-green-700 bg-green-50/50">
                          {r.nhapSL > 0.001 ? fmtNum(r.nhapSL) : <span className="text-[#8b5e3c]/30">—</span>}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-green-700 bg-green-50/50">
                          {r.nhapTien > 0.1 ? Number(r.nhapTien).toLocaleString('vi-VN') : <span className="text-[#8b5e3c]/30">—</span>}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-orange-700 bg-orange-50/50">
                          {r.xuatSL > 0.001 ? fmtNum(r.xuatSL) : <span className="text-[#8b5e3c]/30">—</span>}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-orange-700 bg-orange-50/50">
                          {r.xuatTien > 0.1 ? Number(r.xuatTien).toLocaleString('vi-VN') : <span className="text-[#8b5e3c]/30">—</span>}
                        </td>
                        <td className={`border border-[#e8ddd0] px-2 py-1.5 text-right font-bold ${r.tonCuoi < 0 ? 'text-red-600' : 'text-[#1a0f07]'}`}>
                          {fmtNum(r.tonCuoi)}
                        </td>
                        <td className="border border-[#e8ddd0] px-2 py-1.5 text-right text-[#8b5e3c]">
                          {r.tonCuoiTien > 0.1 ? Number(r.tonCuoiTien).toLocaleString('vi-VN') : <span className="text-[#8b5e3c]/30">—</span>}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-[#f5e6cc]/80 font-bold text-[#3d1f0a]">
                      <td colSpan={3} className="border border-[#e8ddd0] px-2 py-2 text-center">TỔNG CỘNG</td>
                      <td className="border border-[#e8ddd0] px-2 py-2"></td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-green-800">{fmtNum(nxtTotals.nhapSL)}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-green-800">{Number(nxtTotals.nhapTien).toLocaleString('vi-VN')}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-orange-800">{fmtNum(nxtTotals.xuatSL)}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right text-orange-800">{Number(nxtTotals.xuatTien).toLocaleString('vi-VN')}</td>
                      <td className="border border-[#e8ddd0] px-2 py-2"></td>
                      <td className="border border-[#e8ddd0] px-2 py-2 text-right">{Number(nxtTotals.tonCuoiTien).toLocaleString('vi-VN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
    </div>
  )
}
