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
  stt: number; code: string; name: string; category: string; unit: string
  donGia: number
  tonDau: number; tienDau: number
  nhap: number; tienNhap: number
  xuat: number; tienXuat: number
  tonCuoi: number; tienCuoi: number
  tonDauAuto: boolean // true = lấy từ tồn cuối tháng trước (chưa có adj)
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
  const canEdit = !!profile // tất cả user đã đăng nhập đều sửa được tồn đầu

  const now = new Date()
  const [year, setYear]             = useState(now.getFullYear())
  const [month, setMonth]           = useState(now.getMonth() + 1)
  const [rows, setRows]             = useState<TongHopRow[]>([])
  const [nhapDet, setNhapDet]       = useState<NhapRow[]>([])
  const [xuatDet, setXuatDet]       = useState<XuatRow[]>([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')

  // Tồn đầu được chỉnh tay: product_name → qty override
  const [adjMap, setAdjMap]           = useState<Map<string, number>>(new Map())
  const [editingCell, setEditingCell] = useState<string | null>(null) // product_name đang edit
  const [editVal, setEditVal]         = useState('')
  const [saving, setSaving]           = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Lấy danh sách kho/danh mục độc nhất từ allProducts
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of allProducts) {
      if (p.category) set.add(p.category)
    }
    return Array.from(set).sort()
  }, [allProducts])

  useEffect(() => { loadData() }, [year, month, allProducts]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!allProducts.length) return
    setLoading(true)
    try {
      const pad      = (n: number) => String(n).padStart(2, '0')
      const startStr = `${year}-${pad(month)}-01`
      const endStr   = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

      // Map nhanh thông tin sản phẩm (key lowercase + trim)
      const productMap = new Map<string, typeof allProducts[0]>()
      for (const p of allProducts) {
        productMap.set(p.name.trim().toLowerCase(), p)
      }

      // 4 query song song: hoá đơn tháng + adj kiểm kho + tồn lô hiện tại + hoá đơn SAU kỳ
      const [
        { data: inMonthData },
        { data: adjData },
        { data: batchData },
        { data: afterData },
      ] = await Promise.all([
        sb.from('invoices').select('*').gte('inv_date', startStr).lte('inv_date', endStr).order('inv_date'),
        sb.from('stock_opening_adj').select('product_name, adj_qty').eq('year', year).eq('month', month),
        sb.from('batches').select('product_name, remaining_qty').gt('remaining_qty', 0.005),
        sb.from('invoices').select('type, items').gt('inv_date', endStr),
      ])
      const inMonthInvs = (inMonthData || []) as Invoice[]

      // Adj map: số lượng kiểm kho đầu kỳ (key lowercase + trim)
      const newAdjMap = new Map<string, number>()
      for (const a of (adjData || [])) newAdjMap.set(a.product_name.trim().toLowerCase(), a.adj_qty)
      setAdjMap(newAdjMap)

      // Batch map: tổng tồn thực tế theo lô hiện tại (key lowercase + trim)
      const batchMap = new Map<string, number>()
      for (const b of (batchData || [])) {
        const key = b.product_name.trim().toLowerCase()
        batchMap.set(key, (batchMap.get(key) || 0) + b.remaining_qty)
      }

      // Future map: nhập/xuất SAU kỳ báo cáo (key lowercase + trim)
      const futureMap = new Map<string, { fn: number; fx: number }>()
      const getFut = (name: string) => {
        const key = name.trim().toLowerCase()
        if (!futureMap.has(key)) futureMap.set(key, { fn: 0, fx: 0 })
        return futureMap.get(key)!
      }
      for (const inv of (afterData || []) as { type: string; items: (ItemIn | ItemOut)[] }[]) {
        for (const it of inv.items) {
          const name = it.name || ''
          const amt  = (it as ItemIn).amount ?? (it as ItemOut).amount ?? 0
          if (!name || !(amt > 0)) continue
          if (inv.type === 'in') getFut(name).fn += amt
          else getFut(name).fx += amt
        }
      }

      // Nhập/xuất trong tháng (Số lượng & Thành tiền) - Key lowercase + trim
      const pmap = new Map<string, { nhapM: number; tienNhapM: number; xuatM: number; tienXuatM: number }>()
      const get  = (name: string) => {
        const key = name.trim().toLowerCase()
        if (!pmap.has(key)) pmap.set(key, { nhapM: 0, tienNhapM: 0, xuatM: 0, tienXuatM: 0 })
        return pmap.get(key)!
      }

      const nhapRows: NhapRow[] = []
      const xuatRows: XuatRow[] = []

      for (const inv of inMonthInvs) {
        if (inv.type === 'in') {
          for (const it of (inv.items as ItemIn[])) {
            const name = it.name?.trim() || ''
            const amt  = it.amount || 0
            if (!name || !(amt > 0)) continue

            const p = productMap.get(name.toLowerCase())
            const price = it.price || p?.cost_price || 0
            const thanhTien = amt * price

            const e = get(name)
            e.nhapM += amt
            e.tienNhapM += thanhTien

            nhapRows.push({
              ngay: inv.inv_date, soChungTu: inv.code,
              ten: name, dvt: it.unit || p?.unit || '',
              soLuong: amt, donGia: price,
              thanhTien,
              nhaCungCap: inv.partner || '', ghiChu: inv.note || '',
            })
          }
        } else {
          for (const it of (inv.items as ItemOut[])) {
            const name = it.name?.trim() || ''
            const amt  = it.amount! || 0
            if (!name || !(amt > 0)) continue

            const p = productMap.get(name.toLowerCase())
            const price = it.price || p?.cost_price || 0
            const thanhTien = amt * price

            const e = get(name)
            e.xuatM += amt
            e.tienXuatM += thanhTien

            xuatRows.push({
              ngay: inv.inv_date, soChungTu: inv.code,
              ten: name, dvt: it.unit || p?.unit || '',
              donGia: price, soLuong: amt,
              thanhTien,
              ghiChu: inv.note || '',
            })
          }
        }
      }

      // Kê khai thường xuyên (TT200): Tồn cuối = Tồn đầu + Nhập − Xuất
      // tonCuoi tính ngược từ tồn lô hiện tại + biến động tương lai
      // tonDau = tonCuoi − nhapM + xuatM  (hoặc adj nếu có kiểm kho override)
      const result: TongHopRow[] = []
      let stt = 1
      const processedKeys = new Set<string>()

      for (const p of allProducts.filter(p => p.is_active)) {
        const key      = p.name.trim().toLowerCase()
        processedKeys.add(key)

        const e        = pmap.get(key) || { nhapM: 0, tienNhapM: 0, xuatM: 0, tienXuatM: 0 }
        const donGia   = p.cost_price || 0
        const batchQty = parseFloat((batchMap.get(key) || 0).toFixed(2))
        const fut      = futureMap.get(key) || { fn: 0, fx: 0 }
        const hasAdj   = newAdjMap.has(key)

        let tonDau: number
        let tonCuoi: number
        if (hasAdj) {
          // Kiểm kho override: tồn đầu là số chốt, tồn cuối tính từ công thức
          tonDau  = newAdjMap.get(key)!
          tonCuoi = parseFloat((tonDau + e.nhapM - e.xuatM).toFixed(2))
        } else {
          // Tính ngược từ tồn lô thực tế: tonCuoi(kỳ) = batchHiện Tại + futXuat − futNhap
          tonCuoi = parseFloat((batchQty + fut.fx - fut.fn).toFixed(2))
          tonDau  = parseFloat((tonCuoi - e.nhapM + e.xuatM).toFixed(2))
        }

        const tienDau  = parseFloat((tonDau * donGia).toFixed(0))
        const tienNhap = e.tienNhapM || parseFloat((e.nhapM * donGia).toFixed(0))
        const tienXuat = e.tienXuatM || parseFloat((e.xuatM * donGia).toFixed(0))
        const tienCuoi = parseFloat((tonCuoi * donGia).toFixed(0))

        // Hiển thị dòng nếu có phát sinh hoặc tồn kho khác 0
        if (tonDau === 0 && tonCuoi === 0 && e.nhapM === 0 && e.xuatM === 0) continue
        result.push({
          stt: stt++, code: p.code || '', name: p.name, category: p.category || 'Khác', unit: p.unit,
          donGia, tonDau, tienDau, nhap: e.nhapM, tienNhap, xuat: e.xuatM, tienXuat,
          tonCuoi, tienCuoi,
          tonDauAuto: !hasAdj,
        })
      }

      // Xử lý các sản phẩm có hoá đơn nhập/xuất trong tháng nhưng chưa có trong danh mục products active
      for (const [key, e] of pmap.entries()) {
        if (processedKeys.has(key)) continue
        const sampleIn  = nhapRows.find(r => r.ten.trim().toLowerCase() === key)
        const sampleOut = xuatRows.find(r => r.ten.trim().toLowerCase() === key)
        const name      = sampleIn?.ten || sampleOut?.ten || key
        const unit      = sampleIn?.dvt || sampleOut?.dvt || ''
        const donGia    = sampleIn?.donGia || sampleOut?.donGia || 0

        const tonDau   = 0
        const tonCuoi  = parseFloat((e.nhapM - e.xuatM).toFixed(2))
        const tienDau  = 0
        const tienNhap = e.tienNhapM
        const tienXuat = e.tienXuatM
        const tienCuoi = parseFloat((tonCuoi * donGia).toFixed(0))

        result.push({
          stt: stt++, code: '—', name, category: 'Khác', unit,
          donGia, tonDau, tienDau, nhap: e.nhapM, tienNhap, xuat: e.xuatM, tienXuat,
          tonCuoi, tienCuoi,
          tonDauAuto: true,
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
      const key = productName.trim().toLowerCase()
      setAdjMap(prev => new Map(prev).set(key, qty))
      setRows(prev => prev.map(r => {
        if (r.name.trim().toLowerCase() !== key) return r
        const tonCuoiAdj = qty + r.nhap - r.xuat
        return {
          ...r,
          tonDau: qty,
          tienDau: qty * r.donGia,
          tonCuoi: tonCuoiAdj,
          tienCuoi: tonCuoiAdj * r.donGia,
          tonDauAuto: false
        }
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
      const key = productName.trim().toLowerCase()
      setAdjMap(prev => { const m = new Map(prev); m.delete(key); return m })
      loadData()
    } catch (e) {
      toast('Lỗi khi xoá điều chỉnh: ' + (e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Lọc theo danh mục/kho + tìm kiếm ── */
  const filteredRows = useMemo(() => {
    let list = rows
    if (selectedCat !== 'all') {
      list = list.filter(r => r.category === selectedCat)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.code ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [rows, selectedCat, search])

  /* ── Nhóm dữ liệu theo Kho / Danh mục ── */
  const groupedData = useMemo(() => {
    const map = new Map<string, TongHopRow[]>()
    for (const r of filteredRows) {
      const cat = r.category || 'Khác'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(r)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'vi'))
  }, [filteredRows])

  /* ── Export Excel chuẩn MISA (Header 2 tầng + Nhóm theo kho) ── */
  const exportExcel = () => {
    const wb  = XLSX.utils.book_new()
    const tag = `T${month}.${year}`

    // Sheet 1: TỔNG HỢP TỒN KHO (MISA Format)
    const s1Rows: (string | number)[][] = [
      [`TỔNG HỢP TỒN KHO`],
      [`Chi nhánh: Tiệm bánh Chum Chum`],
      [`Kỳ báo cáo: Tháng ${month} năm ${year}`],
      [],
      [
        'STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Đơn giá',
        'Đầu kỳ', '',
        'Nhập kho', '',
        'Xuất kho', '',
        'Cuối kỳ', ''
      ],
      [
        '', '', '', '', '',
        'Số lượng', 'Giá trị',
        'Số lượng', 'Giá trị',
        'Số lượng', 'Giá trị',
        'Số lượng', 'Giá trị'
      ]
    ]

    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
      // STT, Mã hàng, Tên hàng, ĐVT, Đơn giá merge 2 dòng (rows 4..5)
      { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
      { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
      // Đầu kỳ, Nhập kho, Xuất kho, Cuối kỳ merge 2 cột
      { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } },
      { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } },
      { s: { r: 4, c: 9 }, e: { r: 4, c: 10 } },
      { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } },
    ]

    // Duyệt qua từng nhóm Kho
    for (const [catName, catItems] of groupedData) {
      // Dòng tên kho
      s1Rows.push([`Tên kho: ${catName}`])
      const groupHeaderRowIdx = s1Rows.length - 1
      merges.push({ s: { r: groupHeaderRowIdx, c: 0 }, e: { r: groupHeaderRowIdx, c: 12 } })

      let sumTD = 0, sumTDTien = 0, sumN = 0, sumNTien = 0, sumX = 0, sumXTien = 0, sumTC = 0, sumTCTien = 0

      for (const r of catItems) {
        s1Rows.push([
          r.stt, r.code, r.name, r.unit, r.donGia || '',
          r.tonDau, r.tienDau || '',
          r.nhap, r.tienNhap || '',
          r.xuat, r.tienXuat || '',
          r.tonCuoi, r.tienCuoi || ''
        ])
        sumTD += r.tonDau; sumTDTien += r.tienDau
        sumN += r.nhap; sumNTien += r.tienNhap
        sumX += r.xuat; sumXTien += r.tienXuat
        sumTC += r.tonCuoi; sumTCTien += r.tienCuoi
      }

      // Dòng Cộng kho
      s1Rows.push([
        '', '', `Cộng ${catName}`, '', '',
        sumTD, sumTDTien || '',
        sumN, sumNTien || '',
        sumX, sumXTien || '',
        sumTC, sumTCTien || ''
      ])
    }

    // Dòng TỔNG CỘNG CHUNG
    s1Rows.push([
      '', '', 'TỔNG CỘNG', '', '',
      filteredRows.reduce((s, r) => s + r.tonDau, 0),
      filteredRows.reduce((s, r) => s + r.tienDau, 0) || '',
      filteredRows.reduce((s, r) => s + r.nhap, 0),
      filteredRows.reduce((s, r) => s + r.tienNhap, 0) || '',
      filteredRows.reduce((s, r) => s + r.xuat, 0),
      filteredRows.reduce((s, r) => s + r.tienXuat, 0) || '',
      filteredRows.reduce((s, r) => s + r.tonCuoi, 0),
      filteredRows.reduce((s, r) => s + r.tienCuoi, 0) || ''
    ])

    const ws1 = XLSX.utils.aoa_to_sheet(s1Rows)
    ws1['!merges'] = merges
    ws1['!cols'] = [
      { wch: 6 },  // STT
      { wch: 14 }, // Mã hàng
      { wch: 38 }, // Tên hàng
      { wch: 8 },  // ĐVT
      { wch: 12 }, // Đơn giá
      { wch: 12 }, // Đầu kỳ SL
      { wch: 15 }, // Đầu kỳ Giá trị
      { wch: 12 }, // Nhập kho SL
      { wch: 15 }, // Nhập kho Giá trị
      { wch: 12 }, // Xuất kho SL
      { wch: 15 }, // Xuất kho Giá trị
      { wch: 12 }, // Cuối kỳ SL
      { wch: 15 }  // Cuối kỳ Giá trị
    ]
    XLSX.utils.book_append_sheet(wb, ws1, 'Tong hop ton kho')

    // Sheet 2: NHẬP KHO
    const s2Data: (string | number)[][] = [
      [`NHẬP KHO NVL — ${tag}`],
      [],
      ['NGÀY NHẬP','SỐ CHỨNG TỪ','TÊN NGUYÊN LIỆU','ĐVT','SỐ LƯỢNG NHẬP','ĐƠN GIÁ','THÀNH TIỀN','NHÀ CUNG CẤP','GHI CHÚ'],
      ...nhapDet.map(r => [fmtDate(r.ngay), r.soChungTu, r.ten, r.dvt, r.soLuong, r.donGia || '', r.thanhTien || '', r.nhaCungCap, r.ghiChu]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(s2Data)
    ws2['!cols'] = [{wch:12},{wch:14},{wch:38},{wch:8},{wch:14},{wch:12},{wch:14},{wch:36},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws2, 'NHẬP KHO NVL')

    // Sheet 3: XUẤT KHO
    const s3Data: (string | number)[][] = [
      [`XUẤT KHO NVL — ${tag}`],
      [],
      ['NGÀY XUẤT','SỐ CHỨNG TỪ','TÊN NGUYÊN LIỆU','ĐVT','ĐƠN GIÁ','SỐ LƯỢNG XUẤT','THÀNH TIỀN','GHI CHÚ'],
      ...xuatDet.map(r => [fmtDate(r.ngay), r.soChungTu, r.ten, r.dvt, r.donGia || '', r.soLuong, r.thanhTien || '', r.ghiChu]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(s3Data)
    ws3['!cols'] = [{wch:12},{wch:14},{wch:38},{wch:8},{wch:12},{wch:14},{wch:14},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws3, 'XUẤT KHO NVL')

    XLSX.writeFile(wb, `Tong-hop-ton-kho-${tag}.xlsx`)
  }

  const years         = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const totalTonDau   = filteredRows.reduce((s, r) => s + r.tonDau, 0)
  const totalTienDau  = filteredRows.reduce((s, r) => s + r.tienDau, 0)
  const totalNhap     = filteredRows.reduce((s, r) => s + r.nhap, 0)
  const totalTienNhap = filteredRows.reduce((s, r) => s + r.tienNhap, 0)
  const totalXuat     = filteredRows.reduce((s, r) => s + r.xuat, 0)
  const totalTienXuat = filteredRows.reduce((s, r) => s + r.tienXuat, 0)
  const totalTonCuoi  = filteredRows.reduce((s, r) => s + r.tonCuoi, 0)
  const totalTienCuoi = filteredRows.reduce((s, r) => s + r.tienCuoi, 0)

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header báo cáo tổng hợp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-xl border border-[#f5e6cc] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a]">TỔNG HỢP TỒN KHO</h2>
          </div>
          <p className="text-xs text-[#8b5e3c] mt-0.5">
            Chi nhánh: <span className="font-semibold">Tiệm bánh Chum Chum</span> &bull; Kỳ báo cáo: <span className="font-semibold">Tháng {month} năm {year}</span>
          </p>
        </div>

        <button
          onClick={exportExcel}
          disabled={rows.length === 0 || loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1e7a4a] text-white text-sm font-semibold hover:bg-[#165c37] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm self-start sm:self-auto cursor-pointer"
        >
          📥 Xuất Excel (.xlsx)
        </button>
      </div>

      {/* Bộ lọc + Tìm kiếm */}
      <div className="bg-[#fffaf4] rounded-2xl p-4 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="block text-[11px] font-medium text-[#8b5e3c] mb-1">Tháng</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
                {MONTHS_VN.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8b5e3c] mb-1">Năm</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8b5e3c] mb-1">Kho / Danh mục</label>
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none pr-7 font-medium">
                <option value="all">-- Tất cả các kho ({categories.length}) --</option>
                {categories.map(c => <option key={c} value={c}>Kho {c}</option>)}
              </select>
            </div>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c8a87a] text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên hàng..."
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
      </div>

      {/* Stats tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Tồn đầu kỳ', value: (totalTienDau/1e6).toFixed(1)+' tr', sub: fmtNum(totalTonDau) + ' mặt hàng', icon: '📦', color: '#6b7280' },
          { label: 'Tổng nhập kho', value: (totalTienNhap/1e6).toFixed(1)+' tr', sub: fmtNum(totalNhap) + ' sp', icon: '↓', color: '#10b981' },
          { label: 'Tổng xuất kho', value: (totalTienXuat/1e6).toFixed(1)+' tr', sub: fmtNum(totalXuat) + ' sp', icon: '↑', color: '#f59e0b' },
          { label: 'Tồn cuối kỳ', value: (totalTienCuoi/1e6).toFixed(1)+' tr', sub: fmtNum(totalTonCuoi) + ' sp', icon: '💰', color: '#c8773a' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3.5 border-[1.5px] border-[#f5e6cc] text-center shadow-xs">
            <div className="text-xl mb-0.5" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-lg font-bold text-[#3d1f0a]">{s.value}</div>
            <div className="text-[10px] text-[#8b5e3c] mt-0.5 font-medium">{s.label} ({s.sub})</div>
          </div>
        ))}
      </div>

      {/* Bảng TỔNG HỢP TỒN KHO MISA */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="font-semibold text-[#1e293b] flex items-center gap-2">
            <span>Báo cáo Tổng hợp tồn kho</span>
            <span className="px-2 py-0.5 bg-[#e2e8f0] rounded text-[#475569] text-[11px] font-normal">
              {filteredRows.length} mặt hàng
            </span>
          </div>

          <div className="flex gap-3 text-[11px] text-[#64748b] flex-wrap items-center">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400 inline-block"></span>
              Tồn đầu chốt kiểm kho (✏ để sửa)
            </span>
            <span className="text-[#0284c7] font-medium">Tồn cuối = Tồn đầu + Nhập − Xuất</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-[#8b5e3c]">
            <div className="inline-block w-6 h-6 border-2 border-[#c8773a] border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Đang tính toán dữ liệu kho...</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#64748b]">
            {rows.length === 0 ? 'Không có phát sinh dữ liệu kho trong tháng này' : 'Không tìm thấy mặt hàng phù hợp với bộ lọc'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse" style={{ minWidth: '1100px' }}>
              <thead>
                {/* Header tầng 1 */}
                <tr className="bg-[#2c3e50] text-white font-medium text-[11px] border-b border-[#1a252f]">
                  <th rowSpan={2} className="px-2.5 py-2.5 text-center border-r border-[#34495e] w-10">STT</th>
                  <th rowSpan={2} className="px-3 py-2.5 border-r border-[#34495e] w-24">Mã hàng</th>
                  <th rowSpan={2} className="px-3 py-2.5 border-r border-[#34495e] min-w-[200px]">Tên hàng</th>
                  <th rowSpan={2} className="px-2 py-2.5 text-center border-r border-[#34495e] w-14">ĐVT</th>
                  <th rowSpan={2} className="px-3 py-2.5 text-right border-r border-[#34495e] w-24">Đơn giá</th>

                  <th colSpan={2} className="px-3 py-1.5 text-center border-r border-[#34495e] bg-[#34495e]">Đầu kỳ</th>
                  <th colSpan={2} className="px-3 py-1.5 text-center border-r border-[#34495e] bg-[#27ae60]">Nhập kho</th>
                  <th colSpan={2} className="px-3 py-1.5 text-center border-r border-[#34495e] bg-[#d35400]">Xuất kho</th>
                  <th colSpan={2} className="px-3 py-1.5 text-center bg-[#2980b9]">Cuối kỳ</th>
                </tr>

                {/* Header tầng 2 */}
                <tr className="bg-[#34495e] text-white text-[10px] uppercase font-semibold border-b border-[#2c3e50]">
                  {/* Đầu kỳ */}
                  <th className="px-2.5 py-1.5 text-right border-r border-[#455a64] w-20">Số lượng</th>
                  <th className="px-3 py-1.5 text-right border-r border-[#455a64] w-28">Giá trị</th>

                  {/* Nhập kho */}
                  <th className="px-2.5 py-1.5 text-right border-r border-[#455a64] w-20 bg-[#219150]">Số lượng</th>
                  <th className="px-3 py-1.5 text-right border-r border-[#455a64] w-28 bg-[#219150]">Giá trị</th>

                  {/* Xuất kho */}
                  <th className="px-2.5 py-1.5 text-right border-r border-[#455a64] w-20 bg-[#ba4a00]">Số lượng</th>
                  <th className="px-3 py-1.5 text-right border-r border-[#455a64] w-28 bg-[#ba4a00]">Giá trị</th>

                  {/* Cuối kỳ */}
                  <th className="px-2.5 py-1.5 text-right border-r border-[#455a64] w-20 bg-[#2471a3]">Số lượng</th>
                  <th className="px-3 py-1.5 text-right bg-[#2471a3] w-28">Giá trị</th>
                </tr>
              </thead>

              <tbody>
                {groupedData.map(([catName, catItems]) => {
                  const catTD    = catItems.reduce((s, r) => s + r.tonDau, 0)
                  const catTDTien= catItems.reduce((s, r) => s + r.tienDau, 0)
                  const catN     = catItems.reduce((s, r) => s + r.nhap, 0)
                  const catNTien = catItems.reduce((s, r) => s + r.tienNhap, 0)
                  const catX     = catItems.reduce((s, r) => s + r.xuat, 0)
                  const catXTien = catItems.reduce((s, r) => s + r.tienXuat, 0)
                  const catTC    = catItems.reduce((s, r) => s + r.tonCuoi, 0)
                  const catTCTien= catItems.reduce((s, r) => s + r.tienCuoi, 0)

                  return (
                    <tr key={catName} className="contents">
                      {/* Dòng tên Kho MISA */}
                      <tr className="bg-[#eef2f7] border-y border-[#cbd5e1] font-semibold text-[#1e293b]">
                        <td colSpan={13} className="px-3 py-2 border-r border-[#cbd5e1]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs flex items-center gap-1.5 text-[#1e40af]">
                              <span>📁</span> Tên kho: <span className="font-bold">{catName}</span> ({catItems.length} mặt hàng)
                            </span>
                            <span className="text-[11px] font-normal text-[#64748b]">
                              Cộng tồn cuối: <span className="font-semibold text-[#1e293b]">{fmtNum(catTC)}</span> ({catTCTien.toLocaleString('vi-VN')} ₫)
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Các dòng sản phẩm thuộc Kho */}
                      {catItems.map((row, idx) => (
                        <tr key={row.name} className={`hover:bg-[#f8fafc] border-b border-[#e2e8f0] transition-colors ${idx % 2 === 1 ? 'bg-[#fcfdfd]' : ''}`}>
                          <td className="px-2.5 py-2 text-center border-r border-[#e2e8f0] text-[#94a3b8]">{row.stt}</td>
                          <td className="px-3 py-2 border-r border-[#e2e8f0] font-mono text-[11px] text-[#475569]">{row.code || '—'}</td>
                          <td className="px-3 py-2 border-r border-[#e2e8f0] font-medium text-[#0f172a]">{row.name}</td>
                          <td className="px-2 py-2 text-center border-r border-[#e2e8f0] text-[#64748b]">{row.unit}</td>
                          <td className="px-3 py-2 text-right border-r border-[#e2e8f0] text-[#64748b]">
                            {row.donGia ? row.donGia.toLocaleString('vi-VN') : '—'}
                          </td>

                          {/* Đầu kỳ (SL & Giá trị) */}
                          <td
                            className={`px-2.5 py-2 text-right border-r border-[#e2e8f0] font-medium group relative
                              ${!row.tonDauAuto ? 'bg-amber-50 text-amber-800' : 'text-[#334155]'}
                              ${canEdit && editingCell !== row.name ? 'cursor-pointer hover:bg-amber-100' : ''}
                            `}
                            title={
                              !row.tonDauAuto
                                ? `✏ Kiểm kho: ${fmtNum(row.tonDau)}\nClick để sửa · Click ✏ để xoá`
                                : canEdit ? `Tự động tính từ HĐ: ${fmtNum(row.tonDau)}\nClick để chốt kiểm kho` : `Tự động: ${fmtNum(row.tonDau)}`
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
                                  className="w-16 text-right text-xs border border-[#c8773a] rounded px-1 py-0.5 outline-none bg-white text-[#3d1f0a]"
                                  disabled={saving}
                                />
                                <button
                                  onClick={() => saveEdit(row.name)}
                                  disabled={saving}
                                  className="text-green-600 hover:text-green-800 font-bold"
                                  title="Lưu (Enter)"
                                >✓</button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-gray-400 hover:text-red-500 font-bold"
                                  title="Huỷ (Esc)"
                                >✕</button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 justify-end w-full">
                                <span className={!row.tonDauAuto ? 'font-semibold' : ''}>
                                  {fmtNum(row.tonDau)}
                                </span>
                                {!row.tonDauAuto && (
                                  <span
                                    className="text-amber-500 text-[10px] cursor-pointer hover:text-red-500"
                                    title="Xoá số kiểm kho (về tự động)"
                                    onClick={e => { e.stopPropagation(); removeAdj(row.name) }}
                                  >✏</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-[#e2e8f0] text-[#64748b]">
                            {row.tienDau ? row.tienDau.toLocaleString('vi-VN') : '—'}
                          </td>

                          {/* Nhập kho (SL & Giá trị) */}
                          <td className="px-2.5 py-2 text-right border-r border-[#e2e8f0] font-semibold text-[#16a34a]">
                            {row.nhap ? fmtNum(row.nhap) : <span className="text-[#cbd5e1] font-normal">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-[#e2e8f0] text-[#15803d]">
                            {row.tienNhap ? row.tienNhap.toLocaleString('vi-VN') : <span className="text-[#cbd5e1]">—</span>}
                          </td>

                          {/* Xuất kho (SL & Giá trị) */}
                          <td className="px-2.5 py-2 text-right border-r border-[#e2e8f0] font-semibold text-[#d97706]">
                            {row.xuat ? fmtNum(row.xuat) : <span className="text-[#cbd5e1] font-normal">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-[#e2e8f0] text-[#b45309]">
                            {row.tienXuat ? row.tienXuat.toLocaleString('vi-VN') : <span className="text-[#cbd5e1]">—</span>}
                          </td>

                          {/* Cuối kỳ (SL & Giá trị) */}
                          <td
                            className={`px-2.5 py-2 text-right border-r border-[#e2e8f0] font-bold
                              ${row.tonCuoi < 0 ? 'text-red-600 bg-red-50' : row.tonCuoi === 0 ? 'text-[#cbd5e1] font-normal' : 'text-[#0f172a]'}`}
                            title={`Tồn cuối = ${fmtNum(row.tonDau)} + ${fmtNum(row.nhap)} − ${fmtNum(row.xuat)} = ${fmtNum(row.tonCuoi)}`}
                          >
                            {row.tonCuoi !== 0 ? fmtNum(row.tonCuoi) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-[#0f172a]">
                            {row.tienCuoi ? row.tienCuoi.toLocaleString('vi-VN') : '—'}
                          </td>
                        </tr>
                      ))}

                      {/* Dòng Cộng theo Kho */}
                      <tr className="bg-[#f1f5f9] font-semibold text-[#334155] border-b border-[#cbd5e1]">
                        <td colSpan={5} className="px-3 py-1.5 text-right border-r border-[#cbd5e1] italic text-[11px]">
                          Cộng {catName}
                        </td>
                        <td className="px-2.5 py-1.5 text-right border-r border-[#cbd5e1]">{fmtNum(catTD)}</td>
                        <td className="px-3 py-1.5 text-right border-r border-[#cbd5e1]">{catTDTien.toLocaleString('vi-VN')}</td>
                        <td className="px-2.5 py-1.5 text-right border-r border-[#cbd5e1] text-[#16a34a]">{fmtNum(catN)}</td>
                        <td className="px-3 py-1.5 text-right border-r border-[#cbd5e1] text-[#15803d]">{catNTien.toLocaleString('vi-VN')}</td>
                        <td className="px-2.5 py-1.5 text-right border-r border-[#cbd5e1] text-[#d97706]">{fmtNum(catX)}</td>
                        <td className="px-3 py-1.5 text-right border-r border-[#cbd5e1] text-[#b45309]">{catXTien.toLocaleString('vi-VN')}</td>
                        <td className="px-2.5 py-1.5 text-right border-r border-[#cbd5e1] text-[#0f172a]">{fmtNum(catTC)}</td>
                        <td className="px-3 py-1.5 text-right text-[#0f172a]">{catTCTien.toLocaleString('vi-VN')}</td>
                      </tr>
                    </tr>
                  )
                })}
              </tbody>

              {/* TỔNG CỘNG CHUNG */}
              <tfoot>
                <tr className="bg-[#e2e8f0] font-bold text-[#0f172a] text-xs border-t-2 border-[#94a3b8]">
                  <td colSpan={5} className="px-3 py-2.5 text-right border-r border-[#cbd5e1] uppercase">TỔNG CỘNG CHUNG</td>
                  <td className="px-2.5 py-2.5 text-right border-r border-[#cbd5e1]">{fmtNum(totalTonDau)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-[#cbd5e1]">{totalTienDau.toLocaleString('vi-VN')}</td>
                  <td className="px-2.5 py-2.5 text-right border-r border-[#cbd5e1] text-[#16a34a]">{fmtNum(totalNhap)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-[#cbd5e1] text-[#15803d]">{totalTienNhap.toLocaleString('vi-VN')}</td>
                  <td className="px-2.5 py-2.5 text-right border-r border-[#cbd5e1] text-[#d97706]">{fmtNum(totalXuat)}</td>
                  <td className="px-3 py-2.5 text-right border-r border-[#cbd5e1] text-[#b45309]">{totalTienXuat.toLocaleString('vi-VN')}</td>
                  <td className="px-2.5 py-2.5 text-right border-r border-[#cbd5e1] text-[#0f172a]">{fmtNum(totalTonCuoi)}</td>
                  <td className="px-3 py-2.5 text-right text-[#0f172a]">{totalTienCuoi.toLocaleString('vi-VN')} ₫</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
