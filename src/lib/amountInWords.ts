/**
 * Đọc số tiền thành chữ tiếng Việt theo chuẩn chứng từ Quản lý kho
 * Ví dụ: 15200000 -> "Mười lăm triệu hai trăm nghìn đồng chẵn"
 * Chuyển đổi từ ChumChumBakery.Core.Services.AmountInWords (WinForms)
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const SUFFIX_BY_GROUP = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ']

function readTriple(n: number): string {
  const hundreds = Math.floor(n / 100)
  const tens = Math.floor((n / 10) % 10)
  const units = n % 10

  const parts: string[] = []
  if (hundreds > 0) {
    parts.push(DIGITS[hundreds] + ' trăm')
  }

  if (tens === 0 && units > 0) {
    parts.push(hundreds > 0 ? 'linh ' + DIGITS[units] : DIGITS[units])
  } else if (tens === 1) {
    parts.push('mười' + (units === 5 ? ' lăm' : units > 0 ? ' ' + DIGITS[units] : ''))
  } else if (tens > 1) {
    parts.push(
      DIGITS[tens] +
        ' mươi' +
        (units === 1 ? ' mốt' : units === 4 ? ' tư' : units === 5 ? ' lăm' : units > 0 ? ' ' + DIGITS[units] : '')
    )
  }

  return parts.join(' ')
}

export function toVietnameseWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Không đồng'

  const negative = amount < 0
  let whole = Math.floor(Math.abs(amount))
  const fraction = Math.round((Math.abs(amount) - whole) * 100)

  const parts: string[] = []
  if (negative) parts.push('âm ')

  const groups: number[] = []
  if (whole === 0) groups.push(0)
  while (whole > 0) {
    groups.push(whole % 1000)
    whole = Math.floor(whole / 1000)
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (g === 0) continue

    const tripleStr = readTriple(g)
    if (tripleStr) {
      if (parts.length > 0 && g < 100 && i < groups.length - 1) {
        parts.push('linh ' + tripleStr)
      } else {
        parts.push(tripleStr)
      }

      if (i < SUFFIX_BY_GROUP.length) {
        parts.push(SUFFIX_BY_GROUP[i])
      } else {
        parts.push(' tỷ')
      }
      parts.push(' ')
    }
  }

  let result = parts.join('').trim() + ' đồng'
  if (fraction > 0) {
    result += ` ${fraction}/100`
  } else {
    result += ' chẵn'
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1)
}
