'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import DateInput from '@/components/shared/DateInput'
import { fmtDate, fmtPrice, fmtNum, fmtTs } from '@/lib/utils'

// ────────── Types ──────────
interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
  address?: string
  birthday?: string
  tags: string[]
  notes?: string
  rank: 'regular' | 'member' | 'vip'
  points: number
  total_spent: number
  avatar_url?: string
  source?: string
  fb_id?: string
  zalo_id?: string
  created_by: string
  updated_by?: string
  created_at: string
  updated_at?: string
}

interface PointsLog {
  id: number
  customer_id: number
  delta: number
  reason?: string
  inv_code?: string
  created_by?: string
  created_at: string
}

interface Invoice {
  id: number
  code: string
  inv_date: string
  note?: string
  items: { name?: string; amount?: number; price?: number }[]
  partner?: string
}

// ────────── Constants ──────────
const INPUT_CLS = 'w-full px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg text-sm bg-white text-[#3d1f0a] outline-none focus:border-[#c8773a] transition-colors'
const LABEL_CLS = 'block text-xs font-medium text-[#8b5e3c] mb-1'

const RANK_THRESHOLDS = { regular: 0, member: 2_000_000, vip: 10_000_000 }

function computeRank(total_spent: number): 'regular' | 'member' | 'vip' {
  if (total_spent >= RANK_THRESHOLDS.vip) return 'vip'
  if (total_spent >= RANK_THRESHOLDS.member) return 'member'
  return 'regular'
}

function computePoints(total_spent: number): number {
  return Math.floor(total_spent / 10_000)
}

function RankBadge({ rank }: { rank: string }) {
  if (rank === 'vip') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
        ⭐ VIP
      </span>
    )
  }
  if (rank === 'member') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        Thân thiết
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-[#8b5e3c]" style={{ backgroundColor: '#f0ece8' }}>
      Thường
    </span>
  )
}

function Avatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm'
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  if (url) {
    return <img src={url} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold flex-shrink-0`} style={{ background: '#f5e0c8', color: '#c8773a' }}>
      {initials}
    </div>
  )
}

// ────────── Main Component ──────────
export default function CustomersPage() {
  const { sb, user, profile, toast, startLoading, stopLoading, writeAudit } = useApp()

  // List state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRank, setFilterRank] = useState<'all' | 'regular' | 'member' | 'vip'>('all')

  // Detail/Form state
  const [selected, setSelected] = useState<Customer | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'points' | 'orders'>('info')

  // Form fields
  const [form, setForm] = useState<Partial<Customer>>({})
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Points modal
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [pointsDelta, setPointsDelta] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [savingPoints, setSavingPoints] = useState(false)

  // Detail data
  const [pointsLog, setPointsLog] = useState<PointsLog[]>([])
  const [orders, setOrders] = useState<Invoice[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Load customers ──
  const loadCustomers = useCallback(async () => {
    setListLoading(true)
    try {
      const { data, error } = await sb.from('customers').select('*').order('name')
      if (error) throw error
      setCustomers((data ?? []) as Customer[])
    } catch (e) {
      toast((e as Error).message || 'Lỗi tải danh sách khách hàng', 'error')
    } finally {
      setListLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  // ── Load detail data when tab changes ──
  useEffect(() => {
    if (!selected) return
    if (activeTab === 'points') loadPointsLog(selected.id)
    if (activeTab === 'orders') loadOrders(selected.name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selected?.id])

  const loadPointsLog = async (customerId: number) => {
    setDetailLoading(true)
    try {
      const { data, error } = await sb
        .from('customer_points_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPointsLog((data ?? []) as PointsLog[])
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const loadOrders = async (customerName: string) => {
    setDetailLoading(true)
    try {
      const { data, error } = await sb
        .from('invoices')
        .select('id, code, inv_date, note, items, partner')
        .eq('type', 'out')
        .ilike('partner', `%${customerName}%`)
        .order('inv_date', { ascending: false })
      if (error) throw error
      setOrders((data ?? []) as Invoice[])
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Filtered list ──
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? '').includes(search)
      const matchRank = filterRank === 'all' || c.rank === filterRank
      return matchSearch && matchRank
    })
  }, [customers, search, filterRank])

  // ── Open create form ──
  const openCreate = () => {
    setSelected(null)
    setIsCreating(true)
    setForm({ tags: [], rank: 'regular', points: 0, total_spent: 0, source: 'manual' })
    setTagsInput('')
    setActiveTab('info')
  }

  // ── Open detail ──
  const openDetail = (c: Customer) => {
    setSelected(c)
    setIsCreating(false)
    setForm({ ...c })
    setTagsInput((c.tags ?? []).join(', '))
    setActiveTab('info')
    setPointsLog([])
    setOrders([])
  }

  // ── Save customer ──
  const handleSave = async () => {
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    if (!form.name?.trim()) { toast('Vui lòng nhập tên khách hàng', 'error'); return }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const rank = computeRank(form.total_spent ?? 0)
    const points = computePoints(form.total_spent ?? 0)

    startLoading()
    try {
      if (isCreating) {
        const payload = {
          name: form.name.trim(),
          phone: form.phone ?? '',
          email: form.email ?? '',
          address: form.address ?? '',
          birthday: form.birthday || null,
          tags,
          notes: form.notes ?? '',
          rank,
          points,
          total_spent: 0,
          source: form.source ?? 'manual',
          fb_id: form.fb_id ?? '',
          zalo_id: form.zalo_id ?? '',
          created_by: profile?.full_name ?? user.email ?? '',
        }
        const { data, error } = await sb.from('customers').insert(payload).select().single()
        if (error) throw error
        const created = data as Customer
        setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        setSelected(created)
        setIsCreating(false)
        setForm({ ...created })
        await writeAudit('create', 'customer', String(created.id), created.name)
        toast('Đã thêm khách hàng', 'success')
      } else if (selected) {
        const payload = {
          name: form.name.trim(),
          phone: form.phone ?? '',
          email: form.email ?? '',
          address: form.address ?? '',
          birthday: form.birthday || null,
          tags,
          notes: form.notes ?? '',
          rank,
          points,
          source: form.source ?? 'manual',
          fb_id: form.fb_id ?? '',
          zalo_id: form.zalo_id ?? '',
          updated_by: profile?.full_name ?? user.email ?? '',
          updated_at: new Date().toISOString(),
        }
        const { data, error } = await sb.from('customers').update(payload).eq('id', selected.id).select().single()
        if (error) throw error
        if (!data) { toast('Không thể cập nhật — kiểm tra quyền truy cập', 'error'); return }
        const updated = data as Customer
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
        setSelected(updated)
        setForm({ ...updated })
        await writeAudit('update', 'customer', String(updated.id), updated.name)
        toast('Đã cập nhật khách hàng', 'success')
      }
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  // ── Delete customer ──
  const handleDelete = async () => {
    if (!selected) return
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    setShowDeleteConfirm(false)
    startLoading()
    try {
      const { error } = await sb.from('customers').delete().eq('id', selected.id)
      if (error) throw error
      await writeAudit('delete', 'customer', String(selected.id), selected.name)
      setCustomers(prev => prev.filter(c => c.id !== selected.id))
      setSelected(null)
      setIsCreating(false)
      toast('Đã xoá khách hàng', 'success')
    } catch (e) {
      toast('Lỗi xoá: ' + (e as Error).message, 'error')
    } finally {
      stopLoading()
    }
  }

  // ── Adjust points ──
  const handleAdjustPoints = async () => {
    if (!selected) return
    if (!user) { toast('Bạn chưa đăng nhập', 'error'); return }
    const delta = parseInt(pointsDelta)
    if (isNaN(delta) || delta === 0) { toast('Vui lòng nhập số điểm hợp lệ (≠ 0)', 'error'); return }

    setSavingPoints(true)
    try {
      const newPoints = (selected.points ?? 0) + delta
      // Insert log
      const { error: logError } = await sb.from('customer_points_log').insert({
        customer_id: selected.id,
        delta,
        reason: pointsReason || null,
        created_by: profile?.full_name ?? user.email ?? '',
      })
      if (logError) throw logError

      // Update customer points
      const { data, error } = await sb
        .from('customers')
        .update({ points: newPoints, updated_by: profile?.full_name ?? user.email ?? '', updated_at: new Date().toISOString() })
        .eq('id', selected.id)
        .select()
        .single()
      if (error) throw error
      if (!data) { toast('Không thể cập nhật điểm', 'error'); return }
      const updated = data as Customer
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
      setSelected(updated)
      setForm({ ...updated })
      // Reload points log
      await loadPointsLog(selected.id)
      setShowPointsModal(false)
      setPointsDelta('')
      setPointsReason('')
      toast(`Đã ${delta > 0 ? 'cộng' : 'trừ'} ${Math.abs(delta)} điểm`, 'success')
    } catch (e) {
      toast('Lỗi: ' + (e as Error).message, 'error')
    } finally {
      setSavingPoints(false)
    }
  }

  const canWrite = profile?.role === 'admin' || profile?.role === 'manager'
  const isAdmin = profile?.role === 'admin'

  const calcOrderTotal = (o: Invoice) => (o.items ?? []).reduce((s, it) => s + (it.amount ?? 0) * (it.price ?? 0), 0)
  const totalOrdersSpent = useMemo(() => orders.reduce((s, o) => s + calcOrderTotal(o), 0), [orders])

  const showPanel = isCreating || selected !== null

  // ────────── Render ──────────
  return (
    <div className="flex h-full min-h-screen bg-[#fdf6ec]">

      {/* ── Left panel: customer list ── */}
      <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-[#f5e6cc] bg-white ${showPanel ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-[#f5e6cc]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#3d1f0a]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Khách hàng
            </h2>
            {canWrite && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
                style={{ background: '#c8773a' }}
              >
                <span className="text-base leading-none">+</span> Thêm
              </button>
            )}
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Tìm tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={INPUT_CLS}
          />
          {/* Rank filter tabs */}
          <div className="flex gap-1 mt-2">
            {(['all', 'regular', 'member', 'vip'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilterRank(r)}
                className={`flex-1 px-1 py-1 rounded text-xs font-medium transition-colors ${
                  filterRank === r
                    ? 'bg-[#c8773a] text-white'
                    : 'bg-[#fdf6ec] text-[#8b5e3c] hover:bg-[#f5e6cc]'
                }`}
              >
                {r === 'all' ? 'Tất cả' : r === 'regular' ? 'Thường' : r === 'member' ? 'Thân thiết' : 'VIP'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-6 text-center text-sm text-[#8b5e3c]">Đang tải...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8b5e3c]">Không có khách hàng nào</div>
          ) : (
            filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => openDetail(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#f5e6cc] text-left hover:bg-[#fdf6ec] transition-colors ${
                  selected?.id === c.id ? 'bg-[#fdf6ec] border-l-2 border-l-[#c8773a]' : ''
                }`}
              >
                <Avatar name={c.name} url={c.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#3d1f0a] truncate">{c.name}</span>
                    <RankBadge rank={c.rank} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#8b5e3c]">{c.phone || '—'}</span>
                    <span className="text-xs text-[#c8773a] font-medium">⭐ {fmtNum(c.points)}</span>
                  </div>
                  <div className="text-xs text-[#8b5e3c] mt-0.5">{fmtPrice(c.total_spent)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: detail / form ── */}
      {showPanel ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f5e6cc] bg-white">
            <button
              className="md:hidden p-1.5 rounded-lg text-[#8b5e3c] hover:bg-[#fdf6ec]"
              onClick={() => { setSelected(null); setIsCreating(false) }}
            >
              ← Quay lại
            </button>
            <Avatar name={form.name || 'Mới'} url={form.avatar_url} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-[#3d1f0a] truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {isCreating ? 'Thêm khách hàng mới' : (form.name || '—')}
                </h2>
                {!isCreating && form.rank && <RankBadge rank={form.rank} />}
              </div>
              {!isCreating && (
                <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8b5e3c]">
                  <span>⭐ {fmtNum(form.points ?? 0)} điểm</span>
                  <span>•</span>
                  <span>Đã chi: {fmtPrice(form.total_spent ?? 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!isCreating && (
            <div className="flex border-b border-[#f5e6cc] bg-white px-5">
              {(['info', 'points', 'orders'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#c8773a] text-[#c8773a]'
                      : 'border-transparent text-[#8b5e3c] hover:text-[#3d1f0a]'
                  }`}
                >
                  {tab === 'info' ? 'Thông tin' : tab === 'points' ? 'Lịch sử điểm' : 'Đơn hàng'}
                </button>
              ))}
            </div>
          )}

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ──── Info Tab / Create Form ──── */}
            {(activeTab === 'info' || isCreating) && (
              <div className="max-w-2xl space-y-4">
                {/* Tên */}
                <div>
                  <label className={LABEL_CLS}>Tên khách hàng *</label>
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="Nhập tên..."
                    value={form.name ?? ''}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    disabled={!canWrite}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SĐT */}
                  <div>
                    <label className={LABEL_CLS}>Số điện thoại</label>
                    <input
                      type="text"
                      className={INPUT_CLS}
                      placeholder="0909..."
                      value={form.phone ?? ''}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      disabled={!canWrite}
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className={LABEL_CLS}>Email</label>
                    <input
                      type="email"
                      className={INPUT_CLS}
                      placeholder="email@..."
                      value={form.email ?? ''}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      disabled={!canWrite}
                    />
                  </div>
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className={LABEL_CLS}>Địa chỉ</label>
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="Địa chỉ..."
                    value={form.address ?? ''}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    disabled={!canWrite}
                  />
                </div>

                {/* Sinh nhật */}
                <div>
                  <label className={LABEL_CLS}>Sinh nhật</label>
                  <DateInput
                    value={form.birthday ?? ''}
                    onChange={v => setForm(f => ({ ...f, birthday: v }))}
                    className={INPUT_CLS}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className={LABEL_CLS}>Tags (phân cách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="VD: bánh kem, sinh nhật, VIP..."
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    disabled={!canWrite}
                  />
                  {tagsInput && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#f5e0c8', color: '#c8773a' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source */}
                  <div>
                    <label className={LABEL_CLS}>Nguồn</label>
                    <select
                      className={INPUT_CLS}
                      value={form.source ?? 'manual'}
                      onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                      disabled={!canWrite}
                    >
                      <option value="manual">Thủ công</option>
                      <option value="facebook">Facebook</option>
                      <option value="zalo">Zalo</option>
                    </select>
                  </div>
                  {/* Rank (read-only) */}
                  {!isCreating && (
                    <div>
                      <label className={LABEL_CLS}>Hạng (tự động)</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 border-[1.5px] border-[#f5e6cc] rounded-lg bg-[#fdf6ec]">
                        <RankBadge rank={form.rank ?? 'regular'} />
                        <span className="text-xs text-[#8b5e3c]">từ {fmtPrice(form.total_spent ?? 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Points display with adjust button */}
                {!isCreating && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#f5e6cc] bg-[#fdf6ec]">
                    <div>
                      <div className="text-xs text-[#8b5e3c] mb-0.5">Điểm tích lũy</div>
                      <div className="text-xl font-bold text-[#c8773a]">⭐ {fmtNum(form.points ?? 0)}</div>
                      <div className="text-xs text-[#8b5e3c] mt-0.5">1 điểm = 10.000₫ chi tiêu</div>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => { setShowPointsModal(true); setPointsDelta(''); setPointsReason('') }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#c8773a] text-[#c8773a] hover:bg-[#c8773a] hover:text-white transition-colors"
                      >
                        + Điều chỉnh điểm
                      </button>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={LABEL_CLS}>Ghi chú</label>
                  <textarea
                    className={INPUT_CLS + ' resize-none'}
                    rows={3}
                    placeholder="Ghi chú về khách hàng..."
                    value={form.notes ?? ''}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    disabled={!canWrite}
                  />
                </div>

                {/* Social IDs */}
                {(form.source === 'facebook' || form.source === 'zalo') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {form.source === 'facebook' && (
                      <div>
                        <label className={LABEL_CLS}>Facebook ID</label>
                        <input
                          type="text"
                          className={INPUT_CLS}
                          value={form.fb_id ?? ''}
                          onChange={e => setForm(f => ({ ...f, fb_id: e.target.value }))}
                          disabled={!canWrite}
                        />
                      </div>
                    )}
                    {form.source === 'zalo' && (
                      <div>
                        <label className={LABEL_CLS}>Zalo ID</label>
                        <input
                          type="text"
                          className={INPUT_CLS}
                          value={form.zalo_id ?? ''}
                          onChange={e => setForm(f => ({ ...f, zalo_id: e.target.value }))}
                          disabled={!canWrite}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {canWrite && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-85"
                      style={{ background: '#c8773a' }}
                    >
                      {isCreating ? 'Thêm khách hàng' : 'Lưu thay đổi'}
                    </button>
                    {!isCreating && isAdmin && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Xoá
                      </button>
                    )}
                    <button
                      onClick={() => { setSelected(null); setIsCreating(false) }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#8b5e3c] border border-[#f5e6cc] hover:bg-[#fdf6ec] transition-colors"
                    >
                      Huỷ
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ──── Points Log Tab ──── */}
            {!isCreating && activeTab === 'points' && (
              <div>
                {detailLoading ? (
                  <div className="text-center text-sm text-[#8b5e3c] py-8">Đang tải...</div>
                ) : pointsLog.length === 0 ? (
                  <div className="text-center text-sm text-[#8b5e3c] py-8">Chưa có lịch sử điểm</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#f5e6cc]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#fdf6ec] text-[#8b5e3c] text-xs">
                          <th className="text-left px-4 py-3">Ngày</th>
                          <th className="text-left px-4 py-3">Loại</th>
                          <th className="text-right px-4 py-3">Số điểm</th>
                          <th className="text-left px-4 py-3">Lý do</th>
                          <th className="text-left px-4 py-3">Người thực hiện</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointsLog.map(log => (
                          <tr key={log.id} className="border-t border-[#f5e6cc] hover:bg-[#fffaf4]">
                            <td className="px-4 py-3 text-[#3d1f0a] whitespace-nowrap">{fmtTs(log.created_at)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.delta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {log.delta > 0 ? 'Tích điểm' : 'Đổi điểm'}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${log.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {log.delta > 0 ? '+' : ''}{fmtNum(log.delta)}
                            </td>
                            <td className="px-4 py-3 text-[#8b5e3c]">{log.reason || '—'}</td>
                            <td className="px-4 py-3 text-[#8b5e3c]">{log.created_by || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ──── Orders Tab ──── */}
            {!isCreating && activeTab === 'orders' && (
              <div>
                {detailLoading ? (
                  <div className="text-center text-sm text-[#8b5e3c] py-8">Đang tải...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center text-sm text-[#8b5e3c] py-8">Chưa có đơn hàng nào</div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-[#f5e6cc] mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#fdf6ec] text-[#8b5e3c] text-xs">
                            <th className="text-left px-4 py-3">Ngày</th>
                            <th className="text-left px-4 py-3">Mã HĐ</th>
                            <th className="text-left px-4 py-3">Ghi chú</th>
                            <th className="text-right px-4 py-3">Số tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => (
                            <tr key={o.id} className="border-t border-[#f5e6cc] hover:bg-[#fffaf4]">
                              <td className="px-4 py-3 text-[#3d1f0a] whitespace-nowrap">{fmtDate(o.inv_date)}</td>
                              <td className="px-4 py-3 font-mono text-[#c8773a]">{o.code}</td>
                              <td className="px-4 py-3 text-[#8b5e3c] max-w-xs truncate">{o.note || '—'}</td>
                              <td className="px-4 py-3 text-right font-semibold text-[#3d1f0a]">{fmtPrice(calcOrderTotal(o))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end">
                      <div className="px-4 py-3 rounded-lg border border-[#f5e6cc] bg-[#fdf6ec] text-sm">
                        <span className="text-[#8b5e3c]">Tổng chi tiêu từ hoá đơn: </span>
                        <span className="font-bold text-[#c8773a]">{fmtPrice(totalOrdersSpent)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="hidden md:flex flex-1 items-center justify-center text-[#8b5e3c]">
          <div className="text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-sm">Chọn khách hàng để xem chi tiết</p>
            {canWrite && (
              <button
                onClick={openCreate}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#c8773a' }}
              >
                + Thêm khách hàng
              </button>
            )}
          </div>
        </div>
      )}

      {/* ──── Points Adjust Modal ──── */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-[#3d1f0a] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Điều chỉnh điểm
            </h3>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Số điểm (âm = trừ điểm)</label>
                <input
                  type="number"
                  className={INPUT_CLS}
                  placeholder="VD: 50 hoặc -20"
                  value={pointsDelta}
                  onChange={e => setPointsDelta(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Lý do</label>
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="VD: Bù điểm đơn hàng..."
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdjustPoints}
                  disabled={savingPoints}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#c8773a' }}
                >
                  {savingPoints ? 'Đang lưu...' : 'Xác nhận'}
                </button>
                <button
                  onClick={() => setShowPointsModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#8b5e3c] border border-[#f5e6cc] hover:bg-[#fdf6ec]"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──── Delete Confirm Modal ──── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-[#3d1f0a] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Xác nhận xoá
            </h3>
            <p className="text-sm text-[#8b5e3c] mb-5">
              Xoá khách hàng <strong className="text-[#3d1f0a]">{selected?.name}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Xoá
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#8b5e3c] border border-[#f5e6cc] hover:bg-[#fdf6ec]"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
