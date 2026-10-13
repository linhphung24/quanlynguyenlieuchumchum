export const todayStr = () => new Date().toISOString().slice(0, 10)

export const fmtDate = (d: string) => {
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

export function parseDecimal(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  let s = String(val).trim();
  if (!s) return fallback;

  // Xử lý chuỗi có chứa cả '.' và ','
  if (s.includes('.') && s.includes(',')) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Định dạng Việt Nam (1.250,5 -> 1250.5)
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // Định dạng Quốc tế (1,250.5 -> 1250.5)
      s = s.replace(/,/g, '');
    }
  } else {
    // Chỉ có ',' hoặc chỉ có '.' -> đổi ',' thành '.'
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? fallback : num;
}

export const fmtNum = (n: number | string | null | undefined, maxDecimals: number = 4) => {
  const num = parseDecimal(n, 0);
  return num.toLocaleString('vi-VN', { maximumFractionDigits: maxDecimals });
};

export const fmtTs = (ts: string) =>
  new Date(ts).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export const genCode = () =>
  'HD-' + Date.now().toString(36).toUpperCase().slice(-5)

export const initials = (name: string) =>
  name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export const roleClass = (r: string) =>
  r === 'admin'
    ? 'bg-[#fde8e5] text-[#c0392b]'
    : r === 'manager'
    ? 'bg-[#ddeaf8] text-[#2563a8]'
    : 'bg-[#d4f5e3] text-[#1e7a4a]'

export const fmtPrice = (n: number) =>
  !n ? '—' : Number(n).toLocaleString('vi-VN') + ' ₫'

export function xlsxDateToStr(val: unknown): string | null {
  if (!val && val !== 0) return null
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  if (/^\d+(\.\d+)?$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }
  return null
}

export function safeHeaderValue(val: string | null | undefined, fallback: string = ''): string {
  if (!val) return fallback;
  try {
    return encodeURIComponent(String(val).trim());
  } catch {
    return fallback;
  }
}
