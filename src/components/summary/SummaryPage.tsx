'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Invoice } from '@/types'
import { fmtNum, fmtDate } from '@/lib/utils'
import { MONTHS_VN } from '@/lib/constants'
import * as XLSX from 'xlsx'

type ItemIn  = { name: string; amount: number; unit: string; price?: number }
type ItemOut = { name?: string; amount?: number; unit?: string; price?: number }

interface TongHopRow {
  stt: number; code: string; name: string; unit: string
  donGia: number; tonDau: number; nhap: number; xuat: number
  tonCuoi: number; tienCuoi: number
}
interface NhapRow {
  ngay: string; soChungTu: string; ten: string; dvt: string
  soLuong: number; donGia: number; thanhTien: number
  nhaCungCap: string; ghiChu: string
}
interface XuatRow {
  ngay: string; soChungTu: string; ten: string; dvt: string
  donGia: number; soLuong: number; thanhTien: number; ghiChu: string
}

export default function SummaryPage() {
  const { sb, allProducts } = useApp()

  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [rows, setRows]       = useState<TongHopRow[]>([])
  const [nhapDet, setNhapDet] = useState<NhapRow[]>([])
  const [xuatDet, setXuatDet] = useState<XuatRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [year, month, allProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!allProducts.length) return
    setLoading(true)

    const pad = (n: number) => String(n).padStart(2, '0')
    const startStr = `${year}-${pad(month)}-01`
    const endStr   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

    // Load ALL invoices để tính tồn đầu chính xác
    const { data } = await sb.from('invoices').select('*').order('inv_date')
    const allInvs  = (data || []) as Invoice[]

    // Tích lũy nhập/xuất mỗi sản phẩm theo kỳ
    const pmap = new Map<string, { nhapM: number; xuatM: number; nhapAfter: number; xuatAfter: number; donGia: number }>()
    const get = (name: string) => {
      if (!pmap.has(name)) pmap.set(name, { nhapM: 0, xuatM: 0, nhapAfter: 0, xuatAfter: 0, donGia: 0 })
      return pmap.get(name)!
    }

    const nhapRows: NhapRow[] = []
    const xuatRows: XuatRow[] = []

    for (const inv of allInvs) {
      const d         = inv.inv_date
      const inMonth   = d >= startStr && d <= endStr
      const afterMonth = d > endStr

      if (inv.type === 'in') {
        for (const it of (inv.items as ItemIn[])) {
          if (!it.name || !(it.amount > 0)) continue
          const e = get(it.name)
          if (inMonth) {
            e.nhapM += it.amount
            if (it.price) e.donGia = it.price
            nhapRows.push({
              ngay: d, soChungTu: inv.code,
              ten: it.name, dvt: it.unit,
              soLuong: it.amount, donGia: it.price || 0,
              thanhTien: it.amount * (it.price || 0),
              nhaCungCap: inv.partner || '', ghiChu: inv.note || '',
            })
          }
          if (afterMonth) e.nhapAfter += it.amount
        }
      }

      if (inv.type === 'out') {
        for (const it of (inv.items as ItemOut[])) {
          if (!it.name || !(it.amount! > 0)) continue
          const e = get(it.name)
          if (inMonth) {
            e.xuatM += it.amount!
            xuatRows.push({
              ngay: d, soChungTu: inv.code,
              ten: it.name, dvt: it.unit || '',
              donGia: it.price || 0, soLuong: it.amount!,
              thanhTien: it.amount! * (it.price || 0),
              ghiChu: inv.note || '',
            })
          }
          if (afterMonth) e.xuatAfter += it.amount!
        }
      }
    }

    // Xây dựng bảng TỔNG HỢP từ allProducts
    const result: TongHopRow[] = []
    let stt = 1
    for (const p of allProducts.filter(p => p.is_active)) {
      const e = pmap.get(p.name) || { nhapM: 0, xuatM: 0, nhapAfter: 0, xuatAfter: 0, donGia: 0 }
      const donGia  = p.cost_price || e.donGia || 0
      // Tính tồn cuối tháng = tồn hiện tại - nhập sau tháng + xuất sau tháng
      const tonCuoi = (p.stock_qty || 0) - e.nhapAfter + e.xuatAfter
      const tonDau  = tonCuoi - e.nhapM + e.xuatM
      if (e.nhapM === 0 && e.xuatM === 0 && tonDau === 0 && tonCuoi === 0) continue
      result.push({
        stt: stt++, code: p.code || '', name: p.name, unit: p.unit,
        donGia, tonDau, nhap: e.nhapM, xuat: e.xuatM,
        tonCuoi, tienCuoi: tonCuoi * donGia,
      })
    }

    setRows(result)
    setNhapDet(nhapRows)
    setXuatDet(xuatRows)
    setLoading(false)
  }

  /* ── Export Excel 3 sheets ── */
  const exportExcel = () => {
    const wb  = XLSX.utils.book_new()
    const tag = `T${month}.${year}`

    // ── Sheet 1: TỔNG HỢP ──
    const s1Data: (string | number)[][] = [
      [`TỔNG HỢP VẬT LIỆU — ${tag}`],
      [],
      ['STT','MÃ SP','TÊN SẢN PHẨM','ĐVT','ĐƠN GIÁ','TỒN ĐẦU','NHẬP','XUẤT','TỒN CUỐI','TIỀN CUỐI KỲ'],
      ...rows.map(r => [r.stt, r.code, r.name, r.unit, r.donGia || '', r.tonDau, r.nhap, r.xuat, r.tonCuoi, r.tienCuoi || '']),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(s1Data)
    ws1['!cols'] = [{wch:6},{wch:14},{wch:42},{wch:8},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:16}]
    // Style header row (row index 2 = Excel row 3)
    XLSX.utils.book_append_sheet(wb, ws1, 'TỔNG HỢP VẬT LIỆU')

    // ── Sheet 2: NHẬP KHO ──
    const s2Data: (string | number)[][] = [
      [`NHẬP KHO NVL — ${tag}`],
      [],
      ['NGÀY NHẬP','SỐ CHỨNG TỪ','TÊN NGUYÊN LIỆU','ĐVT','SỐ LƯỢNG NHẬP','ĐƠN GIÁ','THÀNH TIỀN','NHÀ CUNG CẤP','GHI CHÚ'],
      ...nhapDet.map(r => [fmtDate(r.ngay), r.soChungTu, r.ten, r.dvt, r.soLuong, r.donGia || '', r.thanhTien || '', r.nhaCungCap, r.ghiChu]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(s2Data)
    ws2['!cols'] = [{wch:12},{wch:14},{wch:38},{wch:8},{wch:14},{wch:12},{wch:14},{wch:36},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws2, 'NHẬP KHO NVL')

    // ── Sheet 3: XUẤT KHO ──
    const s3Data: (string | number)[][] = [
      [`XUẤT KHO NVL — ${tag}`],
      [],
      ['NGÀY XUẤT','SỐ CHỨNG TỪ','TÊN NGUYÊN LIỆU','ĐVT','ĐƠN GIÁ','SỐ LƯỢNG XUẤT','THÀNH TIỀN','GHI CHÚ'],
      ...xuatDet.map(r => [fmtDate(r.ngay), r.soChungTu, r.ten, r.dvt, r.donGia || '', r.soLuong, r.thanhTien || '', r.ghiChu]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(s3Data)
    ws3['!cols'] = [{wch:12},{wch:14},{wch:38},{wch:8},{wch:12},{wch:14},{wch:14},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws3, 'XUẤT KHO NVL')

    XLSX.writeFile(wb, `Quan-li-vat-lieu-${tag}.xlsx`)
  }

  const years       = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const totalNhap   = rows.reduce((s, r) => s + r.nhap, 0)
  const totalXuat   = rows.reduce((s, r) => s + r.xuat, 0)
  const totalTien   = rows.reduce((s, r) => s + r.tienCuoi, 0)
  const totalNhapVnd = nhapDet.reduce((s, r) => s + r.thanhTien, 0)
  const totalXuatVnd = xuatDet.reduce((s, r) => s + r.thanhTien, 0)

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">📊 Tổng kết tháng</h2>

      {/* Bộ lọc + Xuất Excel */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tháng</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {MONTHS_VN.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Năm</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={exportExcel}
            disabled={rows.length === 0 || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e7a4a] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            📥 Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Tổng nhập (SL)', value: fmtNum(totalNhap), icon: '↓', color: '#3aaa6e' },
          { label: 'Tổng xuất (SL)', value: fmtNum(totalXuat), icon: '↑', color: '#c8773a' },
          { label: 'Tiền nhập', value: (totalNhapVnd/1e6).toFixed(1)+' tr', icon: '🧾', color: '#3d1f0a' },
          { label: 'Giá trị tồn', value: (totalTien/1e6).toFixed(1)+' tr', icon: '💰', color: '#8b5e3c' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border-[1.5px] border-[#f5e6cc] text-center">
            <div className="text-2xl mb-1" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[#8b5e3c] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bảng TỔNG HỢP */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-[#3d1f0a]">
            Tổng hợp vật liệu — {MONTHS_VN[month - 1]} {year}
            {!loading && rows.length > 0 &&
              <span className="ml-2 text-xs font-normal text-[#8b5e3c]">({rows.length} mặt hàng)</span>
            }
          </h3>
          <div className="flex gap-3 text-xs text-[#8b5e3c]">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#3aaa6e] inline-block"></span> Nhập</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#c8773a] inline-block"></span> Xuất</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#d94f3d] inline-block"></span> Tồn âm</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Không có dữ liệu trong tháng này</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="border-collapse" style={{ minWidth: '920px', width: '100%' }}>
              <thead>
                <tr className="bg-[#f5e6cc]">
                  <th className="text-center text-[10px] font-semibold uppercase text-[#8b5e3c] px-2 py-2.5 w-10">STT</th>
                  <th className="text-left   text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5">Tên sản phẩm</th>
                  <th className="text-left   text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-16">ĐVT</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-28">Đơn giá</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24">Tồn đầu</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24 text-[#3aaa6e]">Nhập</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24 text-[#c8773a]">Xuất</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24">Tồn cuối</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-32">Tiền cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? '' : 'bg-[#fdf6ec]'} hover:bg-[#fef4e8] transition-colors`}>
                    <td className="px-2 py-2 border-b border-[#f0e8d8] text-xs text-[#aaa] text-center">{row.stt}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm font-medium text-[#3d1f0a]">{row.name}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-[#8b5e3c]">{row.unit}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#8b5e3c]">
                      {row.donGia ? row.donGia.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#3d1f0a]">{fmtNum(row.tonDau)}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-semibold text-[#3aaa6e]">
                      {row.nhap ? fmtNum(row.nhap) : <span className="text-[#ddd]">—</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-semibold text-[#c8773a]">
                      {row.xuat ? fmtNum(row.xuat) : <span className="text-[#ddd]">—</span>}
                    </td>
                    <td className={`px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-bold ${row.tonCuoi < 0 ? 'text-[#d94f3d]' : 'text-[#3d1f0a]'}`}>
                      {fmtNum(row.tonCuoi)}
                    </td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#3d1f0a]">
                      {row.tienCuoi ? row.tienCuoi.toLocaleString('vi-VN') + ' ₫' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5e6cc]">
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-right text-[#3d1f0a]">TỔNG CỘNG</td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-[#3d1f0a]"></td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-[#3aaa6e]">{fmtNum(totalNhap)}</td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-[#c8773a]">{fmtNum(totalXuat)}</td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-[#3d1f0a]"></td>
                  <td className="px-3 py-2 text-sm text-right font-bold text-[#3d1f0a]">{totalTien.toLocaleString('vi-VN')} ₫</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
