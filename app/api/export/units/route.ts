import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const block = searchParams.get('block') || undefined
  const floorStr = searchParams.get('floor') || undefined
  const status = searchParams.get('status') || undefined
  const q = searchParams.get('q') || undefined
  const clientIdStr = searchParams.get('clientId') || undefined
  const floor = floorStr ? Number(floorStr) : undefined
  const clientId = clientIdStr ? Number(clientIdStr) : undefined

  const rows = await prisma.unit.findMany({
    where: {
      block: block || undefined,
      floor: Number.isFinite(floor) ? (floor as number) : undefined,
      clientId: clientId || undefined,
      ...(q ? { client: { fullName: { contains: q } } } : {}),
    },
    include: { client: true },
    orderBy: [{ block: 'asc' }, { floor: 'asc' }, { listNumber: 'asc' }]
  })

  function statusFromTotals(totalPrice?: number | null, totalPaid?: number | null): 'PAID' | 'PARTIAL' | 'UNSOLD' {
    const price = totalPrice || 0
    const paid = totalPaid || 0
    if (!price) return 'UNSOLD'
    if (paid >= price - 0.01) return 'PAID'
    if (paid > 0) return 'PARTIAL'
    return 'UNSOLD'
  }

  const filtered = status ? rows.filter(u => statusFromTotals(u.totalPrice, u.totalPaid) === status) : rows

  const header = ['Blloku','Kati','NrListe','Apartamenti','EmriKlientit','VleraTotale','TotaliPaguar','Mbetur','Progresi','Statusi']
  const csvLines = [header.join(',')]
  const esc = (v: any) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  for (const u of filtered) {
    const st = statusFromTotals(u.totalPrice, u.totalPaid)
    csvLines.push([
      esc(u.block),
      u.floor ?? '',
      u.listNumber ?? '',
      esc(u.apartmentNumber ?? ''),
      esc(u.client?.fullName || ''),
      u.totalPrice ?? 0,
      u.totalPaid ?? 0,
      u.remainingDebt ?? 0,
      u.paymentProgress ?? 0,
      st,
    ].join(','))
  }

  return new Response(csvLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="units.csv"'
    }
  })
}
