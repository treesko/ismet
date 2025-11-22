import * as XLSX from 'xlsx'
import { prisma } from './prisma'
import { safeNumber, parseDate } from './utils'

type SheetResult = {
  units: number
  clients: number
  totalPrice: number
  totalPaid: number
  remainingDebt: number
}

// Known header labels (we will also fuzzy-match them)
const HEADERS = {
  nr: ['Nr'],
  floor: ['Kati'],
  nrOnFloor: ['Nr B ne Kat', 'Nr B në Kat', 'Nr B në kat'],
  clientName: ['Emri dhe mbiemri'],
  residence: ['Vendbanimi'],
  area: ['Sipërfaqja [m2]', 'Siperfaqja [m2]'],
  phone: ['Nr. Kontaktues', 'Nr Kontaktues'],
  saleDate: ['Data e shitjes'],
  contract: ['Kontrata'],
  pricePerM2: ['Cmimi njësi [€/m2]', 'Çmimi njësi [€/m2]', 'Cmimi njesi [€/m2]'],
  totalPrice: ['Vlera e shitjes [€]'],
  totalPaid: ['Total te paguara [€]', 'Totali i paguar [€]'],
  remainingDebt: ['Borgji i mbetur [€]', 'Borxhi i mbetur [€]'],
  paymentProgress: ['Progresi i pagesës [%]'],
  comments: ['Komente'],
  // Payments Pjesa I - IV
  p1Date: ['Pjesa I Data', 'Pjesa I - Data', 'Data Pjesa I'],
  p1Amt: ['Pjesa I Vlera [€]', 'Pjesa I - Vlera [€]', 'Vlera Pjesa I [€]'],
  p2Date: ['Pjesa II Data', 'Pjesa II - Data', 'Data Pjesa II'],
  p2Amt: ['Pjesa II Vlera [€]', 'Pjesa II - Vlera [€]', 'Vlera Pjesa II [€]'],
  p3Date: ['Pjesa III Data', 'Pjesa III - Data', 'Data Pjesa III'],
  p3Amt: ['Pjesa III Vlera [€]', 'Pjesa III - Vlera [€]', 'Vlera Pjesa III [€]'],
  p4Date: ['Pjesa IV Data', 'Pjesa IV - Data', 'Data Pjesa IV'],
  p4Amt: ['Pjesa IV Vlera [€]', 'Pjesa IV - Vlera [€]', 'Vlera Pjesa IV [€]'],
} as const

// Basic fuzzy normalization: lower-case, remove diacritics, punctuation, and extra spaces
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const EXTRA_SYNONYMS: Partial<Record<keyof typeof HEADERS, string[]>> = {
  nr: ['nr', 'numri', 'numri i listes', 'nr i listes', 'nr listes'],
  nrOnFloor: ['nr b ne kat', 'nr b ne kat', 'nr banese ne kat', 'nr ne kat'],
  area: ['siperfaqja m2', 'siperfaqe m2', 'siperfaqja'],
  pricePerM2: ['cmimi njesi eur m2', 'cmimi m2', 'cmimi per m2'],
  totalPaid: ['totali i paguar', 'total te paguara'],
  remainingDebt: ['borxhi i mbetur', 'borgji i mbetur'],
  paymentProgress: ['progresi i pageses'],
  phone: ['nr kontaktues', 'nr kontakt'],
}

function normalizeHeaders(row: Record<string, any>) {
  const map: Record<keyof typeof HEADERS, string | undefined> = {} as any
  const keys = Object.keys(row)
  const normKeys = keys.map(k => ({ raw: k, n: norm(k) }))
  for (const key in HEADERS) {
    const candidates = ([...(HEADERS as any)[key], ...((EXTRA_SYNONYMS as any)[key] || [])] as string[]).map(norm)
    const hit = normKeys.find(k => candidates.some(c => k.n === c || k.n.includes(c)))
    map[key as keyof typeof HEADERS] = hit?.raw
  }
  return map
}

async function upsertClient(fullName?: string, phone?: string | null, residence?: string | null) {
  if (!fullName || !fullName.trim()) return null
  const whereKey = {
    fullName_phone: { fullName, phone: phone || '' }
  } as any
  // Since we don't have a composite unique in schema, emulate by findFirst
  const existing = await prisma.client.findFirst({ where: { fullName, phone: phone || undefined } })
  if (existing) return existing
  return prisma.client.create({ data: { fullName, phone: phone || undefined, residence: residence || undefined } })
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const SYNONYMS: Record<keyof typeof HEADERS, string[]> = {
  nr: ['nr', 'numri', 'numri i listes', 'nr i listes', 'nr listes'],
  floor: ['kati'],
  nrOnFloor: ['nr b ne kat', 'nr banese ne kat', 'nr ne kat'],
  clientName: ['emri dhe mbiemri', 'emri', 'klienti'],
  residence: ['vendbanimi'],
  area: ['siperfaqja m2', 'siperfaqe m2', 'siperfaqja'],
  phone: ['nr kontaktues', 'nr kontakt', 'telefoni'],
  saleDate: ['data e shitjes', 'data shitjes'],
  contract: ['kontrata'],
  pricePerM2: ['cmimi njesi eur m2', 'cmimi m2', 'cmimi per m2', 'cmimi njesi'],
  totalPrice: ['vlera e shitjes', 'vlera totale'],
  totalPaid: ['totali i paguar', 'total te paguara'],
  remainingDebt: ['borxhi i mbetur', 'borgji i mbetur'],
  paymentProgress: ['progresi i pageses'],
  comments: ['komente', 'shënime', 'shenime'],
  p1Date: ['pjesa i data', 'data pjesa i'],
  p1Amt: ['pjesa i vlera', 'vlera pjesa i'],
  p2Date: ['pjesa ii data', 'data pjesa ii'],
  p2Amt: ['pjesa ii vlera', 'vlera pjesa ii'],
  p3Date: ['pjesa iii data', 'data pjesa iii'],
  p3Amt: ['pjesa iii vlera', 'vlera pjesa iii'],
  p4Date: ['pjesa iv data', 'data pjesa iv'],
  p4Amt: ['pjesa iv vlera', 'vlera pjesa iv'],
}

function buildMatcher() {
  const matchers: Record<string, keyof typeof HEADERS> = {}
  for (const key in HEADERS) {
    const all = [...(HEADERS as any)[key], ...(SYNONYMS as any)[key] || []]
    for (const label of all) matchers[norm(label)] = key as keyof typeof HEADERS
  }
  return matchers
}

export async function importWorkbook(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const results: Record<string, SheetResult> = {}
  const sheetNames = wb.SheetNames
  const matchers = buildMatcher()

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, raw: true })
    let units = 0, clients = 0, totalPrice = 0, totalPaidAll = 0, remainingDebtAll = 0

    if (!rows || rows.length === 0) { results[sheetName] = { units, clients, totalPrice, totalPaid: totalPaidAll, remainingDebt: remainingDebtAll }; continue }

    // Find header row by best match
    let headerIdx = 0
    let bestScore = -1
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i]
      let score = 0
      for (const cell of row) {
        if (typeof cell !== 'string') continue
        const n = norm(cell)
        if (matchers[n]) score++
      }
      if (score > bestScore) { bestScore = score; headerIdx = i }
    }

    const headerRow = rows[headerIdx] || []
    const colFor: Partial<Record<keyof typeof HEADERS, number>> = {}
    headerRow.forEach((cell: any, idx: number) => {
      if (typeof cell !== 'string') return
      const k = matchers[norm(cell)]
      if (k && colFor[k] == null) colFor[k] = idx
    })

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.every(v => v == null || String(v).trim() === '')) continue
      const get = (k: keyof typeof HEADERS) => colFor[k] != null ? row[colFor[k] as number] : undefined
      const listNumber = safeNumber(get('nr'))
      const floor = safeNumber(get('floor'))
      const nrOnFloorRaw = get('nrOnFloor')
      const nrOnFloor = nrOnFloorRaw != null ? String(nrOnFloorRaw).trim() : undefined
      const fullNameRaw = get('clientName')
      const fullName = fullNameRaw != null ? String(fullNameRaw).trim() : undefined
      const residence = get('residence') != null ? String(get('residence')).trim() : undefined
      const phone = get('phone') != null ? String(get('phone')).trim() : undefined
      const areaM2 = safeNumber(get('area'))
      const saleDate = parseDate(get('saleDate'))
      const contractInfo = get('contract') != null ? String(get('contract')).trim() : undefined
      const pricePerM2 = safeNumber(get('pricePerM2'))
      const unitTotalPrice = safeNumber(get('totalPrice'))
      const comments = get('comments') != null ? String(get('comments')).trim() : undefined

      if (!listNumber && !nrOnFloor && !fullName && !unitTotalPrice) continue

      const client = await upsertClient(fullName, phone, residence)
      if (client) clients++

      // Derive block name from sheet name (e.g., "Banesat 7A" -> "7A"). If not matching, use sheet name.
      const block = (() => {
        let s = sheetName.trim()
        const m1 = s.match(/\bBlloku\s*nr\.?\s*([0-9]+)\s*([A-Za-z]?)/i)
        if (m1) return `${m1[1]}${m1[2] ? m1[2].toUpperCase() : ''}`.trim()
        const m2 = s.match(/^\s*Banesat\s+(.*)$/i)
        if (m2) return m2[1].trim()
        const m3 = s.match(/^\s*Lista e banesave\s*[-:\s]+(.*)$/i)
        if (m3) return m3[1].trim()
        return s
      })()
      // Ensure a Block entry exists (best-effort; ignore if model not migrated yet)
      try {
        const existingBlock = await prisma.block.findUnique({ where: { name: block } })
        if (!existingBlock) {
          await prisma.block.create({ data: { name: block } })
        }
      } catch {}

      // Create or update Unit keyed by block+listNumber or unique combination
      let unit = await prisma.unit.findFirst({
        where: {
          block,
          listNumber: listNumber ? Math.round(listNumber) : undefined,
          apartmentNumber: nrOnFloor,
        }
      })

      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            block,
            listNumber: listNumber ? Math.round(listNumber) : undefined,
            floor: floor ? Math.round(floor) : undefined,
            apartmentNumber: nrOnFloor,
            areaM2: areaM2,
            pricePerM2: pricePerM2,
            totalPrice: unitTotalPrice,
            saleDate: saleDate,
            contractInfo: contractInfo,
            comments,
            clientId: client?.id,
          }
        })
      } else {
        unit = await prisma.unit.update({
          where: { id: unit.id },
          data: {
            floor: floor ? Math.round(floor) : unit.floor,
            areaM2: areaM2 ?? unit.areaM2,
            pricePerM2: pricePerM2 ?? unit.pricePerM2,
            totalPrice: unitTotalPrice ?? unit.totalPrice,
            saleDate: saleDate ?? unit.saleDate,
            contractInfo: contractInfo ?? unit.contractInfo,
            comments: comments ?? unit.comments,
            clientId: client?.id ?? unit.clientId,
          }
        })
      }

      // Handle payments Pjesa I-IV
      const payments: { label: string, date?: Date, amount?: number }[] = [
        { label: 'Pjesa I', date: parseDate(get('p1Date')), amount: safeNumber(get('p1Amt')) },
        { label: 'Pjesa II', date: parseDate(get('p2Date')), amount: safeNumber(get('p2Amt')) },
        { label: 'Pjesa III', date: parseDate(get('p3Date')), amount: safeNumber(get('p3Amt')) },
        { label: 'Pjesa IV', date: parseDate(get('p4Date')), amount: safeNumber(get('p4Amt')) },
      ]

      for (const p of payments) {
        if (!p.amount || p.amount <= 0) continue
        // upsert by unitId+label+amount+date
        const existing = await prisma.payment.findFirst({ where: { unitId: unit.id, label: p.label, amount: p.amount, date: p.date || undefined } })
        if (!existing) {
          await prisma.payment.create({
            data: {
              unitId: unit.id,
              clientId: client?.id || (unit.clientId as number),
              label: p.label,
              date: p.date,
              amount: p.amount,
            }
          })
        }
      }

      // Recalculate totals
      const unitPayments = await prisma.payment.findMany({ where: { unitId: unit.id } })
      const totalPaid = unitPayments.reduce((s, p) => s + (p.amount || 0), 0)
      const remaining = Math.max((unit.totalPrice || 0) - totalPaid, 0)
      const progress = unit.totalPrice ? (totalPaid / unit.totalPrice) * 100 : 0
      await prisma.unit.update({ where: { id: unit.id }, data: { totalPaid, remainingDebt: remaining, paymentProgress: Math.round(progress * 100) / 100 } })

      units++
      totalPrice += unit.totalPrice || 0
      totalPaidAll += totalPaid
      remainingDebtAll += Math.max((unit.totalPrice || 0) - totalPaid, 0)
    }

    results[sheetName] = { units, clients, totalPrice, totalPaid: totalPaidAll, remainingDebt: remainingDebtAll }
  }

  // Summaries
  const summary = Object.values(results).reduce((acc, r) => {
    acc.units += r.units
    acc.clients += r.clients
    acc.totalPrice += r.totalPrice
    acc.totalPaid += r.totalPaid
    acc.remainingDebt += r.remainingDebt
    return acc
  }, { units: 0, clients: 0, totalPrice: 0, totalPaid: 0, remainingDebt: 0 })

  return { results, summary }
}
