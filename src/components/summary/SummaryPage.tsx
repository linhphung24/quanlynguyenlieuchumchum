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
  hasManualTonDau: boolean
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
  const { sb, user, allProducts, toast, writeAudit } = useApp()

  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [rows, setRows]       = useState<TongHopRow[]>([])
  const [nhapDet, setNhapDet] = useState<NhapRow[]>([])
  const [xuatDet, setXuatDet] = useState<XuatRow[]>([])
  const [loading, setLoading] = useState(false)

  // ── Tồn đầu thủ công ──────────────────────────────────────
  const [openingStocks, setOpeningStocks] = useState<Record<string, number>>({})
  const [editMode, setEditMode]           = useState(false)
  const [tonDauEdits, setTonDauEdits]     = useState<Record<string, string>>({})
  const [savingTonDau, setSavingTonDau]   = useState(false)

  useEffect(() => { loadData() }, [year, month, allProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!allProducts.length) return
    setLoading(true)

    const pad = (n: number) => String(n).padStart(2, '0')
    const startStr = `${year}-${pad(month)}-01`
    const endStr   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

    // Load song song: hoá đơn + tồn đầu thủ công
    const [invRes, osRes] = await Promise.all([
      sb.from('invoices').select('*').order('inv_date'),
      sb.from('opening_stock').select('product_name, qty').eq('month', month).eq('year', year),
    ])

    const allInvs = (invRes.data || []) as Invoice[]

    // Map tồn đầu thủ công: product_name → qty
    const manualMap: Record<string, number> = {}
    for (const r of (osRes.data || []) as { product_name: string; qty: number }[]) {
      manualMap[r.product_name] = r.qty
    }
    setOpeningStocks(manualMap)

    // Tích lũy nhập/xuất mỗi sản phẩm theo kỳ
    const pmap = new Map<string, { nhapM: number; xuatM: number; nhapAfter: number; zuatAfter: number; donGia: number }>()
    const get = (name: string) => {
      if (!pmap.has(name)) pmap.set(name, { nhapM: 0, xuatM: 0, nhapAfter: 0, zuatAfter: 0, donGia: 0 })
      return pmap.get(name)!
    }

    const nhapRows: NhapRow[] = []
    const xuatRows: XuatRow[] = []

    for (const inv of allInvs) {
      const d          = inv.inv_date
      const inMonth    = d >= startStr && d <= endStr
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
          if (afterMonth) e.zuatAfter += it.amount!
        }
      }
    }

    // Xây dựng bảng TỔNG HỢP từ allProducts
    const result: TongHopRow[] = []
    let stt = 1
    for (const p of allProducts.filter(p => p.is_active)) {
      const e = pmap.get(p.name) || { nhapM: 0, xuatM: 0, nhapAfter: 0, zuatAfter: 0, donGia: 0 }
      const donGia = p.cost_price || e.donGia || 0

      // Tồn đầu: dùng giá trị thủ công nếu có, ngược lại tính ngược từ tồn hiện tại
      let tonDau: number
      let hasManualTonDau = false
      if (manualMap[p.name] !== undefined) {
        tonDau = manualMap[p.name]
        hasManualTonDau = true
      } else {
        // Tính ngược: tồn cuối = stock_qty - nhập sau tháng + xuất sau tháng
        const tonCuoiCalc = (p.stock_qty || 0) - e.nhapAfter + e.zuatAfter
        tonDau = tonCuoiCalc - e.nhapM + e.xuatM
      }

      const tonCuoi = tonDau + e.nhapM - e.xuatM

      if (e.nhapM === 0 && e.xuatM === 0 && tonDau === 0 && tonCuoi === 0) continue
      result.push({
        stt: stt++, code: p.code || '', name: p.name, unit: p.unit,
        donGia, tonDau, nhap: e.nhapM, xuat: e.xuatM,
        tonCuoi, tienCuoi: tonCuoi * donGia,
        hasManualTonDau,
      })
    }

    setRows(result)
    setNhapDet(nhapRows)
    setXuatDet(xuatRows)
    setLoading(false)
  }

  // ── Bắt đầu chỉnh sửa tồn đầu ────────────────────────────
  const startEdit = () => {
    const init: Record<string, string> = {}
    for (const r of rows) init[r.name] = String(r.tonDau)
    setTonDauEdits(init)
    setEditMode(true)
  }

  const cancelEdit = () => {
    setTonDauEdits({})
    setEditMode(false)
  }

  // ── Lưu tồn đầu thủ công ─────────────────────────────────
  const saveTonDau = async () => {
    if (!user) { toast('Chưa đăng nhập', 'error'); return }
    setSavingTonDau(true)
    try {
      const records = rows.map(r => ({
        product_name: r.name,
        month,
        year,
        qty: parseFloat(tonDauEdits[r.name] ?? String(r.tonDau)) || 0,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        created_by: user.id,
      }))

      // Upsert theo unique(product_name, month, year)
      const { error } = await sb.from('opening_stock').upsert(records, {
        onConflict: 'product_name,month,year',
      })

      if (error) throw error

      await writeAudit('update', 'opening_stock', null, `Cập nhật tồn đầu tháng ${month}/${year}`)
      toast(`Đã lưu tồn đầu tháng ${month}/${year}`)
      setEditMode(false)
      setTonDauEdits({})
      await loadData()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Lỗi lưu tồn đầu', 'error')
    } finally {
      setSavingTonDau(false)
    }
  }

  // ── Xóa tồn đầu thủ công (quay về tính tự động) ──────────
  const clearManualTonDau = async (productName: string) => {
    if (!user) return
    try {
      const { error } = await sb.from('opening_stock')
        .delete()
        .eq('product_name', productName)
        .eq('month', month)
        .eq('year', year)
      if (error) throw error
      toast(`Đã xoá tồn đầu thủ công cho "${productName}"`)
      await loadData()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Lỗi xoá tồn đầu', 'error')
    }
  }

  /* ── Export Excel 3 sheets ── */
  const exportExcel = () => {
    const wb  = XLSX.utils.book_new()
    const tag = `T${month}.${year}`

    const s1Data: (string | number)[][] = [
      [`TỔNG HỢP VẬT LIỆU — ${tag}`],
      [],
      ['STT','MÃ SP','TÊN SẢN PHẨM','ĐVT','ĐƠN GIÁ','TỒN ĐẦU','NHẬP','XUẤT','TỒN CUỐI','TIỀN CUỐI KỲ'],
      ...rows.map(r => [r.stt, r.code, r.name, r.unit, r.donGia || '', r.tonDau, r.nhap, r.xuat, r.tonCuoi, r.tienCuoi || '']),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(s1Data)
    ws1['!cols'] = [{wch:6},{wch:14},{wch:42},{wch:8},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:16}]
    XLSX.utils.book_append_sheet(wb, ws1, 'TỔNG HỢP VẬT LIỆU')

    const s2Data: (string | number)[][] = [
      [`NHẬP KHO NVL — ${tag}`],
      [],
      ['NGÀY NHẬP','SỐ CHỨNG TỪ','TÊN NGUYÊN LIỆU','ĐVT','SỐ LƯỢNG NHẬP','ĐƠN GIÁ','THÀNH TIỀN','NHÀ CUNG CẤP','GHI CHÚ'],
      ...nhapDet.map(r => [fmtDate(r.ngay), r.soChungTu, r.ten, r.dvt, r.soLuong, r.donGia || '', r.thanhTien || '', r.nhaCungCap, r.ghiChu]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(s2Data)
    ws2['!cols'] = [{wch:12},{wch:14},{wch:38},{wch:8},{wch:14},{wch:12},{wch:14},{wch:36},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws2, 'NHẬP KHO NVL')

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

  const years        = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const totalNhap    = rows.reduce((s, r) => s + r.nhap, 0)
  const totalXuat    = rows.reduce((s, r) => s + r.xuat, 0)
  const totalTien    = rows.reduce((s, r) => s + r.tienCuoi, 0)
  const totalNhapVnd = nhapDet.reduce((s, r) => s + r.thanhTien, 0)
  const manualCount  = rows.filter(r => r.hasManualTonDau).length

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">📊 Tổng kết tháng</h2>

      {/* Bộ lọc + nút */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Tháng</label>
            <select value={month} onChange={e => { setMonth(Number(e.target.value)); setEditMode(false) }}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {MONTHS_VN.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b5e3c] mb-1">Năm</label>
            <select value={year} onChange={e => { setYear(Number(e.target.value)); setEditMode(false) }}
              className="px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex gap-2 ml-auto flex-wrap">
            {/* Nút chỉnh sửa tồn đầu */}
            {!editMode ? (
              <button
                onClick={startEdit}
                disabled={rows.length === 0 || loading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border-[1.5px] border-[#c8773a] text-[#c8773a] bg-white text-sm font-medium hover:bg-[#fff4ea] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✏️ Chỉnh tồn đầu
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border-[1.5px] border-[#f5e6cc] text-[#8b5e3c] bg-white text-sm font-medium hover:bg-[#f5e6cc] transition-all"
                >
                  Huỷ
                </button>
                <button
                  onClick={saveTonDau}
                  disabled={savingTonDau}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#c8773a] text-white text-sm font-medium hover:bg-[#b5672e] transition-all disabled:opacity-50"
                >
                  {savingTonDau ? '⏳ Đang lưu...' : '💾 Lưu tồn đầu'}
                </button>
              </>
            )}

            <button
              onClick={exportExcel}
              disabled={rows.length === 0 || loading || editMode}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1e7a4a] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              📥 Xuất Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Banner chế độ chỉnh sửa */}
        {editMode && (
          <div className="mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <span className="text-base">✏️</span>
            <span>Đang chỉnh sửa tồn đầu tháng <strong>{MONTHS_VN[month - 1]} {year}</strong> — nhập số lượng vào cột <strong>Tồn đầu</strong>, nhấn <strong>Lưu</strong> khi xong.</span>
          </div>
        )}
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
            {!loading && manualCount > 0 && !editMode &&
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-normal text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                ✏️ {manualCount} tồn đầu thủ công
              </span>
            }
          </h3>
          <div className="flex gap-3 text-xs text-[#8b5e3c]">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#3aaa6e] inline-block"></span> Nhập</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#c8773a] inline-block"></span> Xuất</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#d94f3d] inline-block"></span> Tồn âm</span>
            {!editMode && <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Tồn đầu thủ công</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">Không có dữ liệu trong tháng này</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
            <table className="border-collapse" style={{ minWidth: '960px', width: '100%' }}>
              <thead>
                <tr className="bg-[#f5e6cc]">
                  <th className="text-center text-[10px] font-semibold uppercase text-[#8b5e3c] px-2 py-2.5 w-10">STT</th>
                  <th className="text-left   text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5">Tên sản phẩm</th>
                  <th className="text-left   text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-16">ĐVT</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-28">Đơn giá</th>
                  <th className={`text-right text-[10px] font-semibold uppercase px-3 py-2.5 w-28 ${editMode ? 'text-[#c8773a]' : 'text-[#8b5e3c]'}`}>
                    {editMode ? '✏️ Tồn đầu' : 'Tồn đầu'}
                  </th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24 text-[#3aaa6e]">Nhập</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24 text-[#c8773a]">Xuất</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-24">Tồn cuối</th>
                  <th className="text-right  text-[10px] font-semibold uppercase text-[#8b5e3c] px-3 py-2.5 w-32">Tiền cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const editVal = tonDauEdits[row.name] ?? String(row.tonDau)
                  const previewTonCuoi = editMode
                    ? (parseFloat(editVal) || 0) + row.nhap - row.xuat
                    : row.tonCuoi

                  return (
                    <tr key={i} className={`${i % 2 === 0 ? '' : 'bg-[#fdf6ec]'} hover:bg-[#fef4e8] transition-colors`}>
                      <td className="px-2 py-2 border-b border-[#f0e8d8] text-xs text-[#aaa] text-center">{row.stt}</td>
                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm font-medium text-[#3d1f0a]">{row.name}</td>
                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-[#8b5e3c]">{row.unit}</td>
                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#8b5e3c]">
                        {row.donGia ? row.donGia.toLocaleString('vi-VN') : '—'}
                      </td>

                      {/* Cột Tồn đầu — edit mode hoặc hiển thị */}
                      <td className="px-3 py-2 border-b border-[#f0e8d8]">
                        {editMode ? (
                          <input
                            type="number"
                            step="any"
                            value={editVal}
                            onChange={e => setTonDauEdits(prev => ({ ...prev, [row.name]: e.target.value }))}
                            className="w-full px-2 py-1 border-[1.5px] border-[#c8773a] rounded text-sm text-right bg-white text-[#3d1f0a] outline-none focus:ring-1 focus:ring-[#c8773a]"
                          />
                        ) : (
                          <div className="flex items-center justify-end gap-1 group">
                            <span className={`text-sm text-right ${row.hasManualTonDau ? 'text-amber-700 font-semibold' : 'text-[#3d1f0a]'}`}>
                              {fmtNum(row.tonDau)}
                            </span>
                            {row.hasManualTonDau && (
                              <button
                                onClick={() => clearManualTonDau(row.name)}
                                title="Xoá tồn đầu thủ công (quay về tính tự động)"
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-600 hover:text-red-500 transition-all px-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-semibold text-[#3aaa6e]">
                        {row.nhap ? fmtNum(row.nhap) : <span className="text-[#ddd]">—</span>}
                      </td>
                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-semibold text-[#c8773a]">
                        {row.xuat ? fmtNum(row.xuat) : <span className="text-[#ddd]">—</span>}
                      </td>
                      <td className={`px-3 py-2 border-b border-[#f0e8d8] text-sm text-right font-bold ${previewTonCuoi < 0 ? 'text-[#d94f3d]' : editMode ? 'text-[#c8773a]' : 'text-[#3d1f0a]'}`}>
                        {fmtNum(previewTonCuoi)}
                      </td>
                      <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#3d1f0a]">
                        {row.tienCuoi ? row.tienCuoi.toLocaleString('vi-VN') + ' ₫' : '—'}
                      </td>
                    </tr>
                  )
                })}
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
