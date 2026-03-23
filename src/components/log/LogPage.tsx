'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { DailyLog } from '@/types'
import { todayStr, fmtDate, fmtNum, xlsxDateToStr } from '@/lib/utils'

interface LogEntry {
  recipe_id: number
  recipe_name: string
  qty: number
}

interface GroupedLog {
  date: string
  entries: (DailyLog & { recipe_name: string })[]
}

interface ImportRow {
  date: string
  recipe_id: number
  recipe_name: string
  qty: number
}

interface ImportError {
  row: number
  msg: string
}

export default function LogPage() {
  const { sb, user, recipes, toast, startLoading, stopLoading, writeAudit } = useApp()

  const [logDate, setLogDate] = useState(todayStr())
  const [entries, setEntries] = useState<LogEntry[]>([{ recipe_id: 0, recipe_name: '', qty: 0 }])
  const [logs, setLogs] = useState<(DailyLog & { recipe_name: string })[]>([])
  const [openDates, setOpenDates] = useState<Set<string>>(new Set())
  const [importPreview, setImportPreview] = useState<ImportRow[] | null>(null)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [importSheets, setImportSheets] = useState<string[]>([])
  const [importWorkbook, setImportWorkbook] = useState<unknown>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadLogs = async () => {
    const { data } = await sb.from('daily_log').select('*').order('log_date', { ascending: false }).order('id', { ascending: true })
    if (data) {
      const enriched = (data as DailyLog[]).map(l => ({
        ...l,
        recipe_name: recipes.find(r => r.id === l.recipe_id)?.name || '?',
      }))
      setLogs(enriched)
    }
  }

  const groupedLogs: GroupedLog[] = (() => {
    const map = new Map<string, (DailyLog & { recipe_name: string })[]>()
    for (const l of logs) {
      if (!map.has(l.log_date)) map.set(l.log_date, [])
      map.get(l.log_date)!.push(l)
    }
    return Array.from(map.entries()).map(([date, entries]) => ({ date, entries }))
  })()

  const toggleDate = (date: string) => {
    setOpenDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const handleSave = async () => {
    if (!user) return
    const valid = entries.filter(e => e.recipe_id && e.qty > 0)
    if (valid.length === 0) { toast('Chọn công thức và nhập số lượng', 'error'); return }
    startLoading()
    await sb.from('daily_log').delete().eq('log_date', logDate).eq('created_by', user.id)
    const rows = valid.map(e => ({
      log_date: logDate,
      recipe_id: e.recipe_id,
      qty: e.qty,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }))
    const { error } = await sb.from('daily_log').insert(rows)
    if (!error) {
      await writeAudit('create', 'daily_log', null, `Nhật ký ${logDate}: ${valid.length} món`)
      toast('Đã lưu nhật ký')
      await loadLogs()
      setEntries([{ recipe_id: 0, recipe_name: '', qty: 0 }])
    } else {
      toast('Lỗi lưu: ' + error.message, 'error')
    }
    stopLoading()
  }

  const addEntry = () => setEntries([...entries, { recipe_id: 0, recipe_name: '', qty: 0 }])
  const removeEntry = (idx: number) => setEntries(entries.filter((_, i) => i !== idx))
  const updateEntry = (idx: number, field: string, val: unknown) => {
    setEntries(entries.map((e, i) => {
      if (i !== idx) return e
      if (field === 'recipe_id') {
        const r = recipes.find(r => r.id === Number(val))
        return { ...e, recipe_id: Number(val), recipe_name: r?.name || '' }
      }
      return { ...e, [field]: val }
    }))
  }

  const processXlsx = (wb: unknown, sheetName?: string) => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const XLSX = (window as any).__XLSX__
    if (!XLSX) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workbook = wb as any
    const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
    const preview: ImportRow[] = []
    const errors: ImportError[] = []
    const startIdx = (rows[0] && String(rows[0][0]).toLowerCase().includes('ngày')) ? 1 : 0
    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i] as unknown[]
      if (!row || (!row[0] && row[0] !== 0)) continue
      const dateStr = xlsxDateToStr(row[0])
      if (!dateStr) { errors.push({ row: i + 1, msg: `Dòng ${i + 1}: Ngày không hợp lệ` }); continue }
      const recipeName = String(row[1] || '').trim()
      if (!recipeName) { errors.push({ row: i + 1, msg: `Dòng ${i + 1}: Thiếu tên công thức` }); continue }
      const qty = parseFloat(String(row[2] || 0))
      if (!qty || qty <= 0) continue
      const recipe = recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase())
      if (!recipe) { errors.push({ row: i + 1, msg: `Dòng ${i + 1}: Không tìm thấy công thức "${recipeName}"` }); continue }
      preview.push({ date: dateStr, recipe_id: recipe.id, recipe_name: recipe.name, qty })
    }
    setImportPreview(preview)
    setImportErrors(errors)
  }

  const handleFile = async (file: File) => {
    if (typeof window === 'undefined') return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        // Dynamically import xlsx
        const XLSX = await import('xlsx')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).__XLSX__ = XLSX
        const data = ev.target?.result
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        setImportWorkbook(wb)
        if (wb.SheetNames.length > 1) {
          setImportSheets(wb.SheetNames)
        } else {
          setImportSheets([])
          processXlsx(wb)
        }
      } catch {
        toast('Lỗi đọc file', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0 || !user) return
    startLoading()
    const dates = Array.from(new Set(importPreview.map(r => r.date)))
    for (const date of dates) {
      await sb.from('daily_log').delete().eq('log_date', date)
    }
    const rows = importPreview.map(r => ({
      log_date: r.date,
      recipe_id: r.recipe_id,
      qty: r.qty,
      created_by: user.id,
      created_at: new Date().toISOString(),
    }))
    const { error } = await sb.from('daily_log').insert(rows)
    if (!error) {
      await writeAudit('create', 'daily_log', null, `Import ${rows.length} dòng nhật ký`)
      toast(`Đã import ${rows.length} dòng`)
      setImportPreview(null)
      setImportErrors([])
      setImportWorkbook(null)
      setImportSheets([])
      await loadLogs()
    } else {
      toast('Lỗi import: ' + error.message, 'error')
    }
    stopLoading()
  }

  const downloadTemplate = () => {
    const csv = 'Ngày,Tên công thức,Số lượng\n2024-01-01,Bánh mì,50\n'
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_nhat_ky.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#3d1f0a] mb-4">📅 Nhật ký sản xuất</h2>

      {/* Log entry form */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs font-medium text-[#8b5e3c]">Ngày sản xuất:</label>
          <input
            type="date"
            value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="px-3 py-2 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#f0e8d8] mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc]">Công thức</th>
                <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-3 py-2 bg-[#f5e6cc] w-28">Số lượng</th>
                <th className="bg-[#f5e6cc] w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                    <select
                      value={e.recipe_id}
                      onChange={ev => updateEntry(idx, 'recipe_id', ev.target.value)}
                      className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors appearance-none"
                    >
                      <option value={0}>-- Chọn công thức --</option>
                      {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8]">
                    <input
                      type="number"
                      min={0}
                      value={e.qty}
                      onChange={ev => updateEntry(idx, 'qty', parseFloat(ev.target.value) || 0)}
                      className="w-full px-2 py-1 border-[1.5px] border-[#f5e6cc] rounded text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#f0e8d8] text-center">
                    <button onClick={() => removeEntry(idx)} className="bg-transparent border-none text-[#e0a090] text-base cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#fdecea] hover:text-[#c0392b] transition-all">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={addEntry} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-transparent border-[1.5px] border-dashed border-[#c8773a] rounded-lg text-[#c8773a] text-xs cursor-pointer hover:bg-[#fef4e8] transition-all">
            + Thêm dòng
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all mt-2">
            💾 Lưu nhật ký
          </button>
        </div>
      </div>

      {/* XLSX Import */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 mb-4 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3 flex items-center gap-2">
          📂 Import từ Excel
          <button onClick={downloadTemplate} className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-transparent border-[1.5px] border-[#f5e6cc] rounded-lg text-[#8b5e3c] text-xs cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all">
            ⬇ Tải mẫu
          </button>
        </h3>

        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all bg-white ${dragOver ? 'border-[#c8773a] bg-[#fef4e8]' : 'border-[#f5e6cc] hover:border-[#c8773a] hover:bg-[#fef4e8]'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm text-[#8b5e3c]">Kéo thả hoặc nhấn để chọn file Excel (.xlsx, .xls, .csv)</div>
          <div className="text-xs text-[#c8773a] mt-1">Cột A: Ngày | Cột B: Tên công thức | Cột C: Số lượng</div>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {importSheets.length > 1 && (
          <div className="mt-3">
            <p className="text-xs text-[#8b5e3c] mb-2">Chọn sheet:</p>
            <div className="flex gap-2 flex-wrap">
              {importSheets.map(s => (
                <button key={s} onClick={() => processXlsx(importWorkbook, s)} className="px-3 py-1.5 rounded-lg border-[1.5px] border-[#f5e6cc] text-xs text-[#8b5e3c] cursor-pointer hover:border-[#c8773a] hover:text-[#c8773a] transition-all bg-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="mt-3 bg-[#fde8e5] rounded-lg p-3">
            <p className="text-xs font-medium text-[#c0392b] mb-1">Lỗi ({importErrors.length}):</p>
            {importErrors.slice(0, 5).map((e, i) => (
              <div key={i} className="text-xs text-[#c0392b]">{e.msg}</div>
            ))}
            {importErrors.length > 5 && <div className="text-xs text-[#c0392b]">... và {importErrors.length - 5} lỗi khác</div>}
          </div>
        )}

        {importPreview && importPreview.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-[#3d1f0a] mb-2">Xem trước ({importPreview.length} dòng hợp lệ):</p>
            <div className="overflow-x-auto rounded-lg border border-[#f0e8d8]">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">Ngày</th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">Công thức</th>
                    <th className="text-right text-[10px] font-medium uppercase tracking-wider text-[#8b5e3c] px-2 py-1.5 bg-[#f5e6cc]">SL</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 6).map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{fmtDate(r.date)}</td>
                      <td className="px-2 py-1.5 border-b border-[#f0e8d8]">{r.recipe_name}</td>
                      <td className="px-2 py-1.5 border-b border-[#f0e8d8] text-right">{r.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreview.length > 6 && <p className="text-xs text-[#8b5e3c] mt-1">... và {importPreview.length - 6} dòng khác</p>}
            <button onClick={handleConfirmImport} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-[#c8773a] to-[#e8a44a] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-all">
              ✓ Xác nhận import
            </button>
          </div>
        )}
      </div>

      {/* Log history */}
      <div className="bg-[#fffaf4] rounded-2xl p-5 border border-[#f5e6cc] shadow-[0_4px_20px_rgba(200,119,58,0.06)]">
        <h3 className="text-sm font-semibold text-[#3d1f0a] mb-3">Lịch sử sản xuất</h3>
        {groupedLogs.length === 0 ? (
          <div className="text-sm text-[#8b5e3c] text-center py-4">Chưa có nhật ký nào</div>
        ) : (
          <div className="space-y-2">
            {groupedLogs.map(g => (
              <div key={g.date} className="border border-[#f0e8d8] rounded-xl overflow-hidden">
                <div
                  className="flex justify-between items-center p-3 px-4 cursor-pointer select-none bg-[#fdf6ec] hover:bg-[#fef4e8] transition-all"
                  onClick={() => toggleDate(g.date)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#3d1f0a]">📅 {fmtDate(g.date)}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#fdf0e0] text-[#c8773a]">{g.entries.length} món</span>
                  </div>
                  <span className="text-[#8b5e3c] text-sm">{openDates.has(g.date) ? '▲' : '▼'}</span>
                </div>
                {openDates.has(g.date) && (
                  <div className="border-t border-[#f0e8d8]">
                    <table className="w-full border-collapse">
                      <tbody>
                        {g.entries.map((entry, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fdf6ec]'}>
                            <td className="px-4 py-2 text-sm text-[#3d1f0a]">{entry.recipe_name}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-[#c8773a]">{fmtNum(entry.qty)} cái</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
