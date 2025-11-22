import { prisma } from '@/lib/prisma'

export async function GET() {
  const byClient = await prisma.unit.groupBy({ by: ['clientId'], where: { clientId: { not: null } }, _sum: { remainingDebt: true }, _count: { _all: true } })
  const filtered = byClient.filter(x => x.clientId !== null)
  const clientIds = filtered.map(x => x.clientId as number)
  const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } })
  const nameMap = new Map(clients.map(c => [c.id, c.fullName]))

  const header = ['ClientId','ClientName','Units','RemainingDebt']
  const csvLines = [header.join(',')]
  for (const x of filtered) {
    const id = x.clientId as number
    const name = nameMap.get(id) || `Client ${id}`
    csvLines.push([id, '"' + String(name).replace(/"/g, '""') + '"', x._count._all, x._sum.remainingDebt || 0].join(','))
  }
  const body = csvLines.join('\n')
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="top_clients_by_remaining.csv"'
    }
  })
}

