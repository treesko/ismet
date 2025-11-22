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
  const n = Number(String(input).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

export function parseDate(input: any): Date | undefined {
  if (!input) return undefined
  const d = new Date(input)
  if (isNaN(d.getTime())) return undefined
  return d
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
