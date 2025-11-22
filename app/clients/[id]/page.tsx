import PageHeader from '@/components/PageHeader'
import { prisma } from '@/lib/prisma'
import { currencyWith, formatDateWith } from '@/lib/utils'
import Link from 'next/link'
import { Button, Input } from '@/components/forms'
import { deleteClientAction, updateClient } from '@/lib/actions'
import ConfirmSubmit from '@/components/ConfirmSubmit'

export default async function ClientDetail({ params, searchParams }: { params: { id: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const id = Number(params.id)
  const client = await prisma.client.findUnique({ where: { id }, include: { units: { include: { payments: true } }, payments: { include: { unit: true } } } })
  if (!client) return <div>Klienti nuk u gjet</div>
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })

  const success = typeof searchParams.success === 'string' ? searchParams.success : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined

  const totalValue = client.units.reduce((s, u) => s + (u.totalPrice || 0), 0)
  const totalPaid = client.units.reduce((s, u) => s + (u.totalPaid || 0), 0)
  const totalRemaining = client.units.reduce((s, u) => s + (u.remainingDebt || 0), 0)

  const paymentsByUnit = client.payments.reduce((acc: Record<number, { unitLabel: string, payments: typeof client.payments }>, p) => {
    acc[p.unitId] = acc[p.unitId] || { unitLabel: `${p.unit.block}-${p.unit.apartmentNumber || p.unit.listNumber || p.unitId}`, payments: [] as any }
    acc[p.unitId].payments.push(p)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title={client.fullName} breadcrumb={[{ href: '/clients', label: 'Klientët' }]} />
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">U ruajt me sukses.</div>}
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Njësitë</h2>
              <div className="text-xs"><a href={`/api/export/units?clientId=${client.id}`} className="rounded-md border px-2 py-1 text-gray-700">Eksporto njësitë CSV</a></div>
            </div>
            <ul className="mt-3 divide-y">
              {client.units.map(u => (
                <li key={u.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/units/${u.id}`} className="font-medium text-brand hover:underline">{u.block}-{u.apartmentNumber || u.listNumber || u.id}</Link>
                      <div className="text-gray-500">Kati {u.floor ?? '-'} • Sipërfaqja {u.areaM2 ?? '-'} m²</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{currencyWith(u.totalPrice, settings || undefined)}</div>
                      <div className="text-gray-500 text-xs">Paguar {currencyWith(u.totalPaid, settings || undefined)} • Mbetur {currencyWith(u.remainingDebt, settings || undefined)}</div>
                    </div>
                  </div>
                </li>
              ))}
              {client.units.length === 0 && <div className="text-sm text-gray-500">S’ka njësi.</div>}
            </ul>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Pagesat</h2>
              <div className="text-xs flex items-center gap-2">
                <a href={`/api/export/payments?clientId=${client.id}`} className="rounded-md border px-2 py-1 text-gray-700">Eksporto pagesat CSV</a>
                <a href={`/api/export/invoices?clientId=${client.id}`} className="rounded-md border px-2 py-1 text-gray-700">Eksporto faturat CSV</a>
              </div>
            </div>
            <div className="mt-3 space-y-4">
              {Object.entries(paymentsByUnit).map(([unitId, group]) => (
                <div key={unitId}>
                  <div className="text-sm font-medium mb-2">Njësia {group.unitLabel}</div>
                  <ul className="space-y-1 text-sm">
                    {group.payments.map(p => (
                      <li key={p.id} className="flex justify-between">
                        <div>{p.label || 'Pagesë'} • {formatDateWith(p.date, settings || undefined)}</div>
                        <div className="font-medium">{currencyWith(p.amount, settings || undefined)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {Object.keys(paymentsByUnit).length === 0 && <div className="text-sm text-gray-500">S’ka pagesa.</div>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Info klienti</h2>
            <div className="mt-2 text-sm">
              <div><span className="text-gray-500">Telefoni: </span>{client.phone || '-'}</div>
              <div><span className="text-gray-500">Vendbanimi: </span>{client.residence || '-'}</div>
              <div><span className="text-gray-500">Email: </span>{client.email || '-'}</div>
            </div>
            <div className="mt-3"><Link className="text-sm text-brand hover:underline" href={`/invoices/new?clientId=${client.id}`}>Gjenero faturë</Link></div>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Përmbledhje</h2>
            <div className="mt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Vlera totale</span><span className="font-medium">{currencyWith(totalValue, settings || undefined)}</span></div>
              <div className="flex justify-between"><span>Totali i paguar</span><span className="font-medium">{currencyWith(totalPaid, settings || undefined)}</span></div>
              <div className="flex justify-between"><span>E mbetur</span><span className="font-medium">{currencyWith(totalRemaining, settings || undefined)}</span></div>
            </div>
          </section>
        </aside>
        <aside className="space-y-6 lg:col-span-1">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Përpuno klientin</h2>
            <form action={updateClient} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={client.id} />
              <Input label="Emri i plotë" name="fullName" defaultValue={client.fullName} required />
              <Input label="Vendbanimi" name="residence" defaultValue={client.residence || ''} />
              <Input label="Telefoni" name="phone" defaultValue={client.phone || ''} />
              <Input label="Email" name="email" type="email" defaultValue={client.email || ''} />
              <Button type="submit">Ruaj</Button>
            </form>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Zonë e rrezikshme</h2>
            <form action={deleteClientAction} className="mt-3">
              <input type="hidden" name="id" value={client.id} />
              <ConfirmSubmit message="Jeni i sigurt që doni ta fshini këtë klient? Ky veprim s’mund të zhbëhet." className="rounded-md bg-red-600 px-3 py-2 text-sm text-white">Fshi klientin</ConfirmSubmit>
            </form>
            <div className="mt-2 text-xs text-gray-500">Nuk mund të fshihet klienti me njësi, fatura ose pagesa ekzistuese.</div>
          </section>
        </aside>
      </div>
    </div>
  )
}
