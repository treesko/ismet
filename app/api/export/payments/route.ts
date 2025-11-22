import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startStr = searchParams.get('start') || undefined
  const endStr = searchParams.get('end') || undefined
  const clientIdStr = searchParams.get('clientId') || undefined
  const unitIdStr = searchParams.get('unitId') || undefined
  const start = startStr ? new Date(startStr) : undefined
  const end = endStr ? new Date(endStr) : undefined
  const clientId = clientIdStr ? Number(clientIdStr) : undefined
  const unitId = unitIdStr ? Number(unitIdStr) : undefined

  const rows = await prisma.payment.findMany({
    where: {
      clientId: clientId || undefined,
      unitId: unitId || undefined,
      ...(start && !isNaN(start.getTime()) ? { date: { gte: start } } : {}),
      ...(end && !isNaN(end.getTime()) ? { date: { lte: end } } : {}),
    },
    include: { client: true, unit: true },
    orderBy: [{ date: 'desc' }, { id: 'desc' }]
  })

  const header = ['Data','EmriKlientit','Njesia','Pershkrimi','Shuma']
  const csvLines = [header.join(',')]
  for (const r of rows) {
    const unitLabel = `${r.unit.block}-${r.unit.apartmentNumber || r.unit.listNumber || r.unitId}`
    const esc = (v: any) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    csvLines.push([
      esc(r.date ? new Date(r.date).toISOString().slice(0,10) : ''), esc(r.client.fullName), esc(unitLabel), esc(r.label || ''), r.amount
    ].join(','))
  }
  const body = csvLines.join('\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="payments.csv"'
    }
  })
}
