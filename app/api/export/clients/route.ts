import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || undefined
  const startStr = searchParams.get('start') || undefined
  const endStr = searchParams.get('end') || undefined
  const start = startStr ? new Date(startStr) : undefined
  const end = endStr ? new Date(endStr) : undefined

  const clients = await prisma.client.findMany({
    where: {
      ...(q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }] } : {}),
      ...(start && !isNaN(start.getTime()) ? { createdAt: { gte: start } } : {}),
      ...(end && !isNaN(end.getTime()) ? { createdAt: { lte: end } } : {}),
    },
    include: { units: true }
  })

  const header = ['KlientId','Emri','Telefoni','Vendbanimi','Njesite','VleraTotale','TotaliPaguar','Mbetur']
  const csvLines = [header.join(',')]
  const esc = (v: any) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  for (const c of clients) {
    const totalValue = c.units.reduce((s, u) => s + (u.totalPrice || 0), 0)
    const totalPaid = c.units.reduce((s, u) => s + (u.totalPaid || 0), 0)
    const totalRemaining = c.units.reduce((s, u) => s + (u.remainingDebt || 0), 0)
    csvLines.push([
      c.id,
      esc(c.fullName),
      esc(c.phone || ''),
      esc(c.residence || ''),
      c.units.length,
      totalValue,
      totalPaid,
      totalRemaining,
    ].join(','))
  }

  return new Response(csvLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clients.csv"'
    }
  })
}
