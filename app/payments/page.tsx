import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import { prisma } from '@/lib/prisma'
import { currencyWith, formatDateWith } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const startStr = typeof searchParams.start === 'string' ? searchParams.start : undefined
  const endStr = typeof searchParams.end === 'string' ? searchParams.end : undefined
  const start = startStr ? new Date(startStr) : undefined
  const end = endStr ? new Date(endStr) : undefined
  const [settings, payments] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.payment.findMany({
      where: {
        ...(start && !isNaN(start.getTime()) ? { date: { gte: start } } : {}),
        ...(end && !isNaN(end.getTime()) ? { date: { lte: end } } : {}),
      },
      include: { client: true, unit: true },
      orderBy: [{ date: 'desc' }, { id: 'desc' }]
    })
  ])

  const columns = [
    { key: 'date', header: 'Data', render: (r: any) => formatDateWith(r.date, settings || undefined) },
    { key: 'client', header: 'Klienti', render: (r: any) => r.client?.fullName || '-' },
    { key: 'unit', header: 'Njësia', render: (r: any) => `${r.unit.block}-${r.unit.apartmentNumber || r.unit.listNumber || r.unit.id}` },
    { key: 'amount', header: 'Shuma', render: (r: any) => currencyWith(r.amount, settings || undefined) },
    { key: 'label', header: 'Përshkrimi' },
  ]

  return (
    <div>
      <PageHeader title="Pagesat" />
      <div className="mb-4 flex items-center justify-between">
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input name="start" type="date" defaultValue={startStr ?? ''} className="rounded-md border px-3 py-2" />
          <input name="end" type="date" defaultValue={endStr ?? ''} className="rounded-md border px-3 py-2" />
          <button className="rounded-md bg-brand px-3 py-2 text-white">Filtro</button>
          <a href="/payments" className="rounded-md border px-3 py-2 text-gray-700">Pastro</a>
          <a href={`/api/export/payments${startStr || endStr ? `?${new URLSearchParams({ ...(startStr ? { start: startStr } : {}), ...(endStr ? { end: endStr } : {}) }).toString()}` : ''}`} className="rounded-md border px-3 py-2 text-gray-700">Eksporto CSV</a>
        </form>
      </div>
      <DataTable columns={columns as any} data={payments as any} />
    </div>
  )
}
