import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { currencyWith, formatDateWith } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const clientId = typeof searchParams.clientId === 'string' ? Number(searchParams.clientId) : undefined
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
  const due = typeof searchParams.due === 'string' ? searchParams.due : undefined
  const startStr = typeof searchParams.start === 'string' ? searchParams.start : undefined
  const endStr = typeof searchParams.end === 'string' ? searchParams.end : undefined
  const start = startStr ? new Date(startStr) : undefined
  const end = endStr ? new Date(endStr) : undefined

  const [settings, invoices, counts] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    (async () => {
      const now = new Date()
      const in30 = new Date(); in30.setDate(now.getDate() + 30)
      const where: any = {
        clientId: clientId || undefined,
        ...(status === 'Paid' ? { remainingOnInvoice: 0 } : status === 'Unpaid' ? { totalPaidOnInvoice: 0 } : status === 'Partial' ? { AND: [{ totalPaidOnInvoice: { gt: 0 } }, { remainingOnInvoice: { gt: 0 } }] } : {}),
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
      return prisma.invoice.findMany({ where, include: { client: true, unit: true }, orderBy: { issueDate: 'desc' } })
    })(),
    (async () => {
      const paid = await prisma.invoice.count({ where: { remainingOnInvoice: 0 } })
      const partial = await prisma.invoice.count({ where: { AND: [{ totalPaidOnInvoice: { gt: 0 } }, { remainingOnInvoice: { gt: 0 } }] } })
      const unpaid = await prisma.invoice.count({ where: { totalPaidOnInvoice: 0 } })
      return { paid, partial, unpaid }
    })()
  ])

  const columns = [
    { key: 'invoiceNumber', header: 'Fatura', render: (r: any) => <Link href={`/invoices/${r.id}`} className="text-brand hover:underline">{r.invoiceNumber}</Link> },
    { key: 'client', header: 'Klienti', render: (r: any) => r.client.fullName },
    { key: 'unit', header: 'Njësia', render: (r: any) => `${r.unit.block}-${r.unit.apartmentNumber || r.unit.listNumber || r.unit.id}` },
    { key: 'issueDate', header: 'Lëshuar', render: (r: any) => formatDateWith(r.issueDate, settings || undefined) },
    { key: 'dueDate', header: 'Afati', render: (r: any) => formatDateWith(r.dueDate, settings || undefined) },
    { key: 'subtotal', header: 'Totali', render: (r: any) => currencyWith(r.subtotal, settings || undefined) },
    { key: 'remaining', header: 'E mbetur', render: (r: any) => currencyWith(r.remainingOnInvoice, settings || undefined) },
  ]

  return (
    <div>
      <PageHeader title="Faturat" />
      {settings?.companyName && (
        <div className="-mt-4 mb-4 text-sm text-gray-600">{settings.companyName}</div>
      )}
      {/* Quick filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a href="/invoices?status=Paid" className="rounded-md border bg-white p-3 transition hover:shadow-md block">
          <div className="text-sm text-gray-500">Paguar</div>
          <div className="mt-1 text-xl font-semibold text-brand">{counts.paid}</div>
        </a>
        <a href="/invoices?status=Partial" className="rounded-md border bg-white p-3 transition hover:shadow-md block">
          <div className="text-sm text-gray-500">Pjesërisht</div>
          <div className="mt-1 text-xl font-semibold text-brand">{counts.partial}</div>
        </a>
        <a href="/invoices?status=Unpaid" className="rounded-md border bg-white p-3 transition hover:shadow-md block">
          <div className="text-sm text-gray-500">Pa paguar</div>
          <div className="mt-1 text-xl font-semibold text-brand">{counts.unpaid}</div>
        </a>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-7 w-full md:w-auto">
          <input name="clientId" placeholder="ID Klienti" defaultValue={clientId ?? ''} className="rounded-md border px-3 py-2" />
          <select name="status" defaultValue={status ?? ''} className="rounded-md border px-3 py-2">
            <option value="">Të gjitha</option>
            <option value="Paid">Paguar</option>
            <option value="Partial">Pjesërisht</option>
            <option value="Unpaid">Pa paguar</option>
          </select>
          <select name="due" defaultValue={due ?? ''} className="rounded-md border px-3 py-2">
            <option value="">Çfarëdo afati</option>
            <option value="overdue">Vonesa</option>
            <option value="next30">30 ditët e ardhshme</option>
          </select>
          <input name="start" type="date" defaultValue={startStr ?? ''} className="rounded-md border px-3 py-2" />
          <input name="end" type="date" defaultValue={endStr ?? ''} className="rounded-md border px-3 py-2" />
          <button className="rounded-md bg-brand px-3 py-2 text-white">Filtro</button>
          <a href="/invoices" className="rounded-md border px-3 py-2 text-gray-700">Pastro</a>
        </form>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <a href={`/api/export/invoices?${new URLSearchParams({ ...(clientId ? { clientId: String(clientId) } : {}), ...(status ? { status } : {}), ...(due ? { due } : {}), ...(startStr ? { start: startStr } : {}), ...(endStr ? { end: endStr } : {}) }).toString()}`} className="rounded-md border px-3 py-2 text-gray-700">Eksporto CSV</a>
          <a href="/invoices/new" className="rounded-md bg-brand px-3 py-2 text-white">Faturë e re</a>
        </div>
      </div>
      <div className="card"><div className="card-content"><DataTable columns={columns as any} data={invoices as any} /></div></div>
    </div>
  )
}
