export function currency(n?: number | null): string {
  const value = typeof n === 'number' ? n : 0
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
}

export function currencyWith(n?: number | null, settings?: { locale?: string | null, currencyCode?: string | null }): string {
  const value = typeof n === 'number' ? n : 0
  const locale = settings?.locale || 'de-DE'
  const curCode = settings?.currencyCode || 'EUR'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: curCode, maximumFractionDigits: 2 }).format(value)
  } catch {
    return currency(value) // fallback to default
  }
}

export function percent(n?: number | null): string {
  const value = typeof n === 'number' ? n : 0
  return `${value.toFixed(2)}%`
}

export function statusFromTotals(totalPrice?: number | null, totalPaid?: number | null): 'PAID' | 'PARTIAL' | 'UNSOLD' {
  const price = totalPrice || 0
  const paid = totalPaid || 0
  if (!price) return 'UNSOLD'
  if (paid >= price - 0.01) return 'PAID'
  if (paid > 0) return 'PARTIAL'
  return 'UNSOLD'
}

export function safeNumber(input: any): number | undefined {
  if (input == null || input === '') return undefined
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined
  let s = String(input).trim().replace(/\u00A0/g, ' ')
  // Keep digits, separators and minus
  s = s.replace(/[^0-9,.-]/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  // Determine decimal separator by whichever appears last
  let decimalSep: ',' | '.' | null = null
  if (lastComma >= 0 || lastDot >= 0) {
    decimalSep = lastComma > lastDot ? ',' : '.'
  }
  if (decimalSep === ',') {
    // Remove thousand separators '.' and replace ',' with '.'
    s = s.replace(/\./g, '')
    s = s.replace(/,/g, '.')
  } else if (decimalSep === '.') {
    // Remove thousand separators ','
    s = s.replace(/,/g, '')
  } else {
    // No clear decimal; remove all separators except leading minus
    s = s.replace(/[,\.]/g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export function parseDate(input: any): Date | undefined {
  if (!input) return undefined
  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input
  if (typeof input === 'number') {
    // Excel serial date detection (rough range)
    if (input > 10000 && input < 100000) {
      const excelEpoch = Date.UTC(1899, 11, 30)
      const ms = Math.round(input * 86400 * 1000)
      return new Date(excelEpoch + ms)
    }
    const d = new Date(input)
    return isNaN(d.getTime()) ? undefined : d
  }
  const s = String(input).trim()
  // Try common formats: dd/MM/yyyy, dd.MM.yyyy, yyyy-MM-dd
  let m = s.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/)
  if (m) {
    const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3])
    const date = new Date(y, mo, d)
    return isNaN(date.getTime()) ? undefined : date
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3])
    const date = new Date(y, mo, d)
    return isNaN(date.getTime()) ? undefined : date
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

export function formatDateWith(d?: Date | string | null, settings?: { locale?: string | null, dateFormat?: string | null }): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-'
  const pattern = settings?.dateFormat || 'dd/MM/yyyy'
  const DD = String(date.getDate()).padStart(2, '0')
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const YYYY = String(date.getFullYear())
  try {
    // Replace tokens case-insensitively: dd, mm, yyyy
    return pattern
      .replace(/yyyy/gi, YYYY)
      .replace(/dd/gi, DD)
      .replace(/mm/gi, MM)
  } catch {
    const locale = settings?.locale || 'de-DE'
    try { return new Intl.DateTimeFormat(locale).format(date) } catch { return date.toLocaleDateString() }
  }
}
