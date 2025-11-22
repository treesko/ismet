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
  remainingDebt: ['Borgji i mbetur [€]'],
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
}

function normalizeHeaders(row: Record<string, any>) {
  const map: Record<keyof typeof HEADERS, string | undefined> = {} as any
  const keys = Object.keys(row)
  for (const key in HEADERS) {
    const candidates = (HEADERS as any)[key] as string[]
    map[key as keyof typeof HEADERS] = keys.find(k => candidates.includes(k))
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

export async function importWorkbook(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const results: Record<string, SheetResult> = {}
  const sheetNames = wb.SheetNames

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null })
    let units = 0, clients = 0, totalPrice = 0, totalPaidAll = 0, remainingDebtAll = 0

    for (const row of json) {
      const h = normalizeHeaders(row)
      const listNumber = safeNumber(h.nr ? row[h.nr] : undefined)
      const floor = safeNumber(h.floor ? row[h.floor] : undefined)
      const nrOnFloor = h.nrOnFloor ? String(row[h.nrOnFloor] ?? '') : undefined
      const fullName = h.clientName ? String(row[h.clientName] ?? '').trim() : undefined
      const residence = h.residence ? String(row[h.residence] ?? '') : undefined
      const phone = h.phone ? String(row[h.phone] ?? '') : undefined
      const areaM2 = safeNumber(h.area ? row[h.area] : undefined)
      const saleDate = parseDate(h.saleDate ? row[h.saleDate] : undefined)
      const contractInfo = h.contract ? String(row[h.contract] ?? '') : undefined
      const pricePerM2 = safeNumber(h.pricePerM2 ? row[h.pricePerM2] : undefined)
      const unitTotalPrice = safeNumber(h.totalPrice ? row[h.totalPrice] : undefined)
      const comments = h.comments ? String(row[h.comments] ?? '') : undefined

      if (!listNumber && !nrOnFloor && !fullName && !unitTotalPrice) {
        continue // skip empty
      }

      const client = await upsertClient(fullName, phone, residence)
      if (client) clients++

      // Derive block name from sheet name (e.g., "Banesat 7A" -> "7A"). If not matching, use sheet name.
      const block = (() => {
        const m = sheetName.match(/^\s*Banesat\s+(.*)$/i)
        return (m ? m[1] : sheetName).trim()
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
        { label: 'Pjesa I', date: parseDate(h.p1Date ? row[h.p1Date] : undefined), amount: safeNumber(h.p1Amt ? row[h.p1Amt] : undefined) },
        { label: 'Pjesa II', date: parseDate(h.p2Date ? row[h.p2Date] : undefined), amount: safeNumber(h.p2Amt ? row[h.p2Amt] : undefined) },
        { label: 'Pjesa III', date: parseDate(h.p3Date ? row[h.p3Date] : undefined), amount: safeNumber(h.p3Amt ? row[h.p3Amt] : undefined) },
        { label: 'Pjesa IV', date: parseDate(h.p4Date ? row[h.p4Date] : undefined), amount: safeNumber(h.p4Amt ? row[h.p4Amt] : undefined) },
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
