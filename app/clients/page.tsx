import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { currencyWith } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const start = typeof searchParams.start === 'string' ? new Date(searchParams.start) : undefined
  const end = typeof searchParams.end === 'string' ? new Date(searchParams.end) : undefined
  const [settings, clients] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.client.findMany({
      where: {
        ...(q ? { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }] } : {}),
        ...(start && !isNaN(start.getTime()) ? { createdAt: { gte: start } } : {}),
        ...(end && !isNaN(end.getTime()) ? { createdAt: { lte: end } } : {}),
      },
      include: { units: true, payments: true }
    })
  ])

  const rows = clients.map(c => {
    const totalValue = c.units.reduce((s, u) => s + (u.totalPrice || 0), 0)
    const totalPaid = c.units.reduce((s, u) => s + (u.totalPaid || 0), 0)
    const totalRemaining = c.units.reduce((s, u) => s + (u.remainingDebt || 0), 0)
    return { id: c.id, name: c.fullName, phone: c.phone || '-', residence: c.residence || '-', units: c.units.length, totalValue, totalPaid, totalRemaining }
  })

  const columns = [
    { key: 'name', header: 'Emri', render: (r: any) => <Link href={`/clients/${r.id}`} className="text-brand hover:underline">{r.name}</Link> },
    { key: 'phone', header: 'Telefoni' },
    { key: 'residence', header: 'Vendbanimi' },
    { key: 'units', header: 'Njësitë' },
    { key: 'totalValue', header: 'Vlera totale', render: (r: any) => currencyWith(r.totalValue, settings || undefined) },
    { key: 'totalPaid', header: 'Totali i paguar', render: (r: any) => currencyWith(r.totalPaid, settings || undefined) },
    { key: 'totalRemaining', header: 'E mbetur', render: (r: any) => currencyWith(r.totalRemaining, settings || undefined) },
  ]

  return (
    <div>
      <PageHeader title="Klientët" />
      <div className="mb-4 flex items-center justify-between">
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input name="q" placeholder="Kërko emrin ose telefonin" defaultValue={q ?? ''} className="rounded-md border px-3 py-2" />
          <input name="start" type="date" className="rounded-md border px-3 py-2" />
          <input name="end" type="date" className="rounded-md border px-3 py-2" />
          <button className="rounded-md bg-brand px-3 py-2 text-white">Filtro</button>
          <a href={`/api/export/clients?${new URLSearchParams({ ...(q ? { q } : {}), ...(start ? { start: start.toISOString().slice(0,10) } : {}), ...(end ? { end: end.toISOString().slice(0,10) } : {}) }).toString()}`} className="rounded-md border px-3 py-2 text-gray-700">Eksporto CSV</a>
        </form>
        <a href="/clients/new" className="rounded-md bg-brand px-3 py-2 text-white">Klient i ri</a>
      </div>
      <DataTable columns={columns as any} data={rows as any} />
    </div>
  )
}
