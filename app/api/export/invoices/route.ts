import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const due = searchParams.get('due') || undefined
  const clientIdStr = searchParams.get('clientId') || undefined
  const startStr = searchParams.get('start') || undefined
  const endStr = searchParams.get('end') || undefined
  const unitIdStr = searchParams.get('unitId') || undefined
  const clientId = clientIdStr ? Number(clientIdStr) : undefined
  const start = startStr ? new Date(startStr) : undefined
  const end = endStr ? new Date(endStr) : undefined
  const unitId = unitIdStr ? Number(unitIdStr) : undefined

  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)

  const where: any = {
    clientId: clientId || undefined,
    unitId: unitId || undefined,
    ...(status === 'Paid'
      ? { remainingOnInvoice: 0 }
      : status === 'Unpaid'
      ? { totalPaidOnInvoice: 0 }
      : status === 'Partial'
      ? { AND: [{ totalPaidOnInvoice: { gt: 0 } }, { remainingOnInvoice: { gt: 0 } }] }
      : {}),
  }
  if (start && !isNaN(start.getTime())) where.issueDate = { ...(where.issueDate || {}), gte: start }
  if (end && !isNaN(end.getTime())) where.issueDate = { ...(where.issueDate || {}), lt: end }
  if (due === 'overdue') {
    where.remainingOnInvoice = { gt: 0 }
    where.dueDate = { lt: now }
  } else if (due === 'next30') {
    where.remainingOnInvoice = { gt: 0 }
    where.dueDate = { gte: now, lte: in30 }
  }

  const rows = await prisma.invoice.findMany({ where, include: { client: true, unit: true }, orderBy: { issueDate: 'desc' } })

  const header = ['NrFature','EmriKlientit','Njesia','DataLeshimit','Afati','Nentotali','Paguar','Mbetur']
  const csvLines = [header.join(',')]
  const esc = (v: any) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  for (const r of rows) {
    const unitLabel = `${r.unit.block}-${r.unit.apartmentNumber || r.unit.listNumber || r.unitId}`
    csvLines.push([
      esc(r.invoiceNumber),
      esc(r.client.fullName),
      esc(unitLabel),
      esc(new Date(r.issueDate).toISOString().slice(0,10)),
      esc(new Date(r.dueDate).toISOString().slice(0,10)),
      r.subtotal,
      r.totalPaidOnInvoice,
      r.remainingOnInvoice,
    ].join(','))
  }

  return new Response(csvLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="invoices.csv"'
    }
  })
}
