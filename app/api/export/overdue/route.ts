import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = await prisma.invoice.findMany({
    where: { remainingOnInvoice: { gt: 0 }, dueDate: { lt: new Date() } },
    include: { client: true, unit: true },
    orderBy: { dueDate: 'asc' }
  })

  const header = ['NrFature','EmriKlientit','Njesia','DataLeshimit','Afati','Nentotali','Paguar','Mbetur']
  const csvLines = [header.join(',')]
  for (const r of rows) {
    const unitLabel = `${r.unit.block}-${r.unit.apartmentNumber || r.unit.listNumber || r.unitId}`
    const esc = (v: any) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    csvLines.push([
      esc(r.invoiceNumber), esc(r.client.fullName), esc(unitLabel), esc(new Date(r.issueDate).toISOString().slice(0,10)), esc(new Date(r.dueDate).toISOString().slice(0,10)), r.subtotal, r.totalPaidOnInvoice, r.remainingOnInvoice
    ].join(','))
  }
  const body = csvLines.join('\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="overdue_invoices.csv"'
    }
  })
}
