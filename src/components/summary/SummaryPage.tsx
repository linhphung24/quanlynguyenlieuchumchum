'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  const { sb, allProducts, profile, toast } = useApp()
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  const now = new Date()
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [rows, setRows]       = useState<TongHopRow[]>([])
  const [nhapDet, setNhapDet] = useState<NhapRow[]>([])
  const [xuatDet, setXuatDet] = useState<XuatRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')

  // Tồn đầu được chỉnh tay: product_name → qty override
  const [adjMap, setAdjMap]           = useState<Map<string, number>>(new Map())
  const [editingCell, setEditingCell] = useState<string | null>(null) // product_name đang edit
  const [editVal, setEditVal]         = useState('')
  const [saving, setSaving]           = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [year, month, allProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!allProducts.length) return
    setLoading(true)
    try {
      const pad      = (n: number) => String(n).padStart(2, '0')
      const startStr = `${year}-${pad(month)}-01`
      const endStr   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

      // 2 query song song: hoá đơn trong tháng + điều chỉnh tồn đầu
      const [{ data: inMonthData }, { data: adjData }] = await Promise.all([
        sb.from('invoices').select('*')
          .gte('inv_date', startStr).lte('inv_date', endStr)
          .order('inv_date'),
        sb.from('stock_opening_adj').select('product_name, adj_qty')
          .eq('year', year).eq('month', month),
      ])
      const inMonthInvs = (inMonthData || []) as Invoice[]

      // Cập nhật adjMap
      const newAdjMap = new Map<string, number>()
      for (const a of (adjData || [])) newAdjMap.set(a.product_name, a.adj_qty)
      setAdjMap(newAdjMap)

      const pmap = new Map<string, { nhapM: number; xuatM: number; donGia: number }>()
      const get  = (name: string) => {
        if (!pmap.has(name)) pmap.set(name, { nhapM: 0, xuatM: 0, donGia: 0 })
        return pmap.get(name)!
      }

      const nhapRows: NhapRow[] = []
      const xuatRows: XuatRow[] = []

      for (const inv of inMonthInvs) {
        if (inv.type === 'in') {
          for (const it of (inv.items as ItemIn[])) {
            if (!it.name || !(it.amount > 0)) continue
            const e = get(it.name)
            e.nhapM += it.amount
            if (it.price) e.donGia = it.price
            nhapRows.push({
              ngay: inv.inv_date, soChungTu: inv.code,
              ten: it.name, dvt: it.unit,
              soLuong: it.amount, donGia: it.price || 0,
              thanhTien: it.amount * (it.price || 0),
              nhaCungCap: inv.partner || '', ghiChu: inv.note || '',
            })
          }
        } else {
          for (const it of (inv.items as ItemOut[])) {
            if (!it.name || !(it.amount! > 0)) continue
            const e = get(it.name)
            e.xuatM += it.amount!
            xuatRows.push({
              ngay: inv.inv_date, soChungTu: inv.code,
              ten: it.name, dvt: it.unit || '',
              donGia: it.price || 0, soLuong: it.amount!,
              thanhTien: it.amount! * (it.price || 0),
              ghiChu: inv.note || '',
            })
          }
        }
      }

      // Công thức: tồn đầu = nhập tay (adj_qty, mặc định 0)
      //            tồn cuối = tồn đầu + nhập − xuất
      const result: TongHopRow[] = []
      let stt = 1
      for (const p of allProducts.filter(p => p.is_active)) {
        const e       = pmap.get(p.name) || { nhapM: 0, xuatM: 0, donGia: 0 }
        const donGia  = p.cost_price || e.donGia || 0
        const tonDau  = newAdjMap.get(p.name) ?? 0
        const tonCuoi = tonDau + e.nhapM - e.xuatM
        if (e.nhapM === 0 && e.xuatM === 0 && tonDau === 0) continue
        result.push({
          stt: stt++, code: p.code || '', name: p.name, unit: p.unit,
          donGia, tonDau, nhap: e.nhapM, xuat: e.xuatM,
          tonCuoi, tienCuoi: tonCuoi * donGia,
        })
      }

      setRows(result)
      setNhapDet(nhapRows)
      setXuatDet(xuatRows)
    } catch (e) {
      console.error('SummaryPage loadData error:', e)
    } finally {
      setLoading(false)
    }
  }

  /* ── Inline edit tồn đầu ── */
  const openEdit = (productName: string, currentTonDau: number) => {
    if (!canEdit) return
    setEditingCell(productName)
    setEditVal(String(currentTonDau))
    setTimeout(() => editInputRef.current?.select(), 30)
  }

  const cancelEdit = () => { setEditingCell(null); setEditVal('') }

  const saveEdit = async (productName: string) => {
    const qty = parseFloat(editVal)
    if (isNaN(qty)) { cancelEdit(); return }
    setSaving(true)
    try {
      const { error } = await sb.from('stock_opening_adj').upsert(
        { product_name: productName, year, month, adj_qty: qty,
          updated_by: profile?.full_name || '' },
        { onConflict: 'product_name,year,month' }
      )
      if (error) throw error
      setAdjMap(prev => new Map(prev).set(productName, qty))
      // Cập nhật row tương ứng
      setRows(prev => prev.map(r => {
        if (r.name !== productName) return r
        const tonCuoiAdj = qty + r.nhap - r.xuat
        return { ...r, tonDau: qty, tonCuoi: tonCuoiAdj, tienCuoi: tonCuoiAdj * r.donGia }
      }))
    } catch (e) {
      toast('Lỗi khi lưu: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
      cancelEdit()
    }
  }

  const removeAdj = async (productName: string) => {
    setSaving(true)
    try {
      const { error } = await sb.from('stock_opening_adj')
        .delete()
        .eq('product_name', productName).eq('year', year).eq('month', month)
      if (error) throw error
      setAdjMap(prev => { const m = new Map(prev); m.delete(productName); return m })
      loadData()
    } catch (e) {
      toast('Lỗi khi xoá điều chỉnh: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Search filter (client-side, không gây reload) ── */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.code ?? '').toLowerCase().includes(q)
    )
  }, [rows, search])

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

  const years         = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const totalNhap     = rows.reduce((s, r) => s + r.nhap, 0)
  const totalXuat     = rows.reduce((s, r) => s + r.xuat, 0)
  const totalTien     = rows.reduce((s, r) => s + r.tienCuoi, 0)
  const totalNhapVnd  = nhapDet.reduce((s, r) => s + r.thanhTien, 0)

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
          { label: 'Tổng nhập (SL)', value: fmtNum(totalNhap),                      icon: '↓',  color: '#3aaa6e' },
          { label: 'Tổng xuất (SL)', value: fmtNum(totalXuat),                      icon: '↑',  color: '#c8773a' },
          { label: 'Tiền nhập',      value: (totalNhapVnd/1e6).toFixed(1)+' tr',    icon: '🧾', color: '#3d1f0a' },
          { label: 'Giá trị tồn',    value: (totalTien/1e6).toFixed(1)+' tr',       icon: '💰', color: '#8b5e3c' },
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
            {!loading && rows.length > 0 && (
              <span className="ml-2 text-xs font-normal text-[#8b5e3c]">
                ({filteredRows.length !== rows.length
                  ? `${filteredRows.length}/${rows.length} mặt hàng`
                  : `${rows.length} mặt hàng`})
              </span>
            )}
          </h3>
          <div className="flex gap-3 text-xs text-[#8b5e3c] flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#3aaa6e] inline-block"></span> Nhập</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#c8773a] inline-block"></span> Xuất</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400 inline-block"></span> Tồn đầu đã nhập ✏</span>
            {canEdit && <span className="text-[#c8773a] italic">(click ô Tồn đầu để nhập)</span>}
          </div>
        </div>

        {/* Search box */}
        <div className="mb-3">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c8a87a] text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã SP..."
              className="w-full pl-8 pr-8 py-2 text-sm border-[1.5px] border-[#f5e6cc] rounded-lg bg-white text-[#3d1f0a] placeholder-[#c8a87a] outline-none focus:border-[#c8773a] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c8a87a] hover:text-[#c8773a] text-xs cursor-pointer"
              >✕</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">
            <div className="inline-block w-5 h-5 border-2 border-[#c8773a] border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Đang tải...</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8b5e3c]">
            {rows.length === 0 ? 'Không có dữ liệu trong tháng này' : 'Không tìm thấy sản phẩm phù hợp'}
          </div>
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
                {filteredRows.map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? '' : 'bg-[#fdf6ec]'} hover:bg-[#fef4e8] transition-colors`}>
                    <td className="px-2 py-2 border-b border-[#f0e8d8] text-xs text-[#aaa] text-center">{row.stt}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm font-medium text-[#3d1f0a]">{row.name}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-[#8b5e3c]">{row.unit}</td>
                    <td className="px-3 py-2 border-b border-[#f0e8d8] text-sm text-right text-[#8b5e3c]">
                      {row.donGia ? row.donGia.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td
                      className={`px-3 py-2 border-b border-[#f0e8d8] text-sm text-right group relative
                        ${adjMap.has(row.name) ? 'bg-amber-50 text-amber-700' : 'text-[#8b5e3c]'}
                        ${canEdit && editingCell !== row.name ? 'cursor-pointer hover:bg-[#fff3e0]' : ''}
                      `}
                      title={
                        adjMap.has(row.name)
                          ? `✏ Đã nhập tay: ${fmtNum(row.tonDau)}\nClick để sửa`
                          : canEdit ? 'Click để nhập tồn đầu' : '(chưa nhập tồn đầu)'
                      }
                      onClick={() => editingCell !== row.name && openEdit(row.name, row.tonDau)}
                    >
                      {editingCell === row.name ? (
                        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <input
                            ref={editInputRef}
                            type="number"
                            step="0.01"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(row.name)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="w-20 text-right text-sm border border-[#c8773a] rounded px-1 py-0.5 outline-none bg-white text-[#3d1f0a]"
                            disabled={saving}
                          />
                          <button
                            onClick={() => saveEdit(row.name)}
                            disabled={saving}
                            className="text-[#1e7a4a] hover:text-green-700 text-base font-bold leading-none"
                            title="Lưu (Enter)"
                          >✓</button>
                          <button
                            onClick={cancelEdit}
                            className="text-[#aaa] hover:text-[#c8773a] text-base font-bold leading-none"
                            title="Huỷ (Esc)"
                          >✕</button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 justify-end">
                          <span className={adjMap.has(row.name) ? 'font-semibold' : 'text-[#bbb]'}>
                            {adjMap.has(row.name) ? fmtNum(row.tonDau) : '—'}
                          </span>
                          {adjMap.has(row.name) && (
                            <span
                              className="text-amber-400 text-xs cursor-pointer hover:text-red-500"
                              title="Xoá — hoàn về 0"
                              onClick={e => { e.stopPropagation(); removeAdj(row.name) }}
                            >✏</span>
                          )}
                          {canEdit && !adjMap.has(row.name) && editingCell !== row.name && (
                            <span className="opacity-0 group-hover:opacity-60 text-[#c8773a] text-xs transition-opacity">+</span>
                          )}
                        </span>
                      )}
                    </td>
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
