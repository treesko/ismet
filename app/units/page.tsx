import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { currencyWith, percent, statusFromTotals } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: 'PAID' | 'PARTIAL' | 'UNSOLD' }) {
  const color = status === 'PAID' ? 'bg-green-100 text-green-800' : status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
  return <span className={`rounded px-2 py-1 text-xs ${color}`}>{status}</span>
}

export default async function UnitsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const block = typeof searchParams.block === 'string' ? searchParams.block : undefined
  const floor = typeof searchParams.floor === 'string' ? Number(searchParams.floor) : undefined
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const soldOnly = typeof searchParams.sold === 'string' ? (searchParams.sold === '1' || searchParams.sold.toLowerCase() === 'true' || searchParams.sold === 'on') : false

  const [settings, units, blocks] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.unit.findMany({
      where: {
        block: block || undefined,
        floor: floor || undefined,
        ...(q ? { client: { fullName: { contains: q } } } : {}),
      },
      include: { client: true },
      orderBy: [{ block: 'asc' }, { floor: 'asc' }, { listNumber: 'asc' }]
    }),
    prisma.block.findMany({ orderBy: { name: 'asc' } })
  ])

  const filtered = units.filter(u => {
    const s = statusFromTotals(u.totalPrice, u.totalPaid)
    if (status && s !== status) return false
    if (soldOnly && s === 'UNSOLD') return false
    return true
  })

  const columns = [
    { key: 'block', header: 'Blloku', render: (u: any) => <Link href={`/units/${u.id}`} className="text-brand hover:underline">{u.block}</Link> },
    { key: 'listNumber', header: 'Nr' },
    { key: 'floor', header: 'Kati' },
    { key: 'apartmentNumber', header: 'Apartamenti' },
    { key: 'areaM2', header: 'Sipërfaqja m²' },
    { key: 'client', header: 'Klienti', render: (u: any) => u.client ? <Link href={`/clients/${u.client.id}`} className="text-brand hover:underline">{u.client.fullName}</Link> : '-' },
    { key: 'totalPrice', header: 'Vlera totale', render: (u: any) => currencyWith(u.totalPrice, settings || undefined) },
    { key: 'totalPaid', header: 'Totali i paguar', render: (u: any) => currencyWith(u.totalPaid, settings || undefined) },
    { key: 'remainingDebt', header: 'E mbetur', render: (u: any) => currencyWith(u.remainingDebt, settings || undefined) },
    { key: 'paymentProgress', header: 'Progresi', render: (u: any) => percent(u.paymentProgress) },
    { key: 'status', header: 'Statusi', render: (u: any) => <StatusBadge status={statusFromTotals(u.totalPrice, u.totalPaid)} /> },
  ]

  return (
    <div>
      <PageHeader title="Njësitë" />
      <div className="mb-3 flex items-center justify-between">
        <form className="grid grid-cols-2 gap-3 sm:grid-cols-6 items-end">
          <select name="block" defaultValue={block} className="rounded-md border px-3 py-2">
            <option value="">Të gjitha blloqet</option>
            {blocks.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          <input name="floor" placeholder="Kati" defaultValue={floor ?? ''} className="rounded-md border px-3 py-2" />
          <select name="status" defaultValue={status} className="rounded-md border px-3 py-2">
            <option value="">Të gjitha statuset</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="UNSOLD">UNSOLD</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="sold" defaultChecked={soldOnly} className="h-4 w-4" />
            <span>Vetëm të shitura</span>
          </label>
          <input name="q" placeholder="Kërko klientin" defaultValue={q ?? ''} className="rounded-md border px-3 py-2" />
          <button className="rounded-md bg-brand px-3 py-2 text-white">Filtro</button>
          <a href="/units" className="rounded-md border px-3 py-2 text-gray-700">Pastro</a>
        </form>
        <div className="flex gap-2">
          <a href={`/api/export/units?${new URLSearchParams({ ...(block ? { block } : {}), ...(floor ? { floor: String(floor) } : {}), ...(status ? { status } : {}), ...(soldOnly ? { sold: '1' } : {}), ...(q ? { q } : {}) }).toString()}`} className="rounded-md border px-3 py-2 text-gray-700">Eksporto CSV</a>
          <a href="/blocks" className="rounded-md border px-3 py-2 text-gray-700">Menaxho blloqet</a>
          <a href="/units/new" className="rounded-md bg-brand px-3 py-2 text-white">Njësi e re</a>
        </div>
      </div>

      <DataTable columns={columns as any} data={filtered.map(u => ({ ...u, id: u.id, client: u.client })) as any} />

      <div className="mt-4 text-sm text-gray-500">Kliko një rresht për të parë detajet.</div>
      <div className="mt-2 text-sm">
        {filtered.map(u => (
          <div key={u.id} className="hidden">
            <Link href={`/units/${u.id}`}>View</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
