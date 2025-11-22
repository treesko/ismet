import PageHeader from '@/components/PageHeader'
import { Button, Input, Select, Textarea } from '@/components/forms'
import { prisma } from '@/lib/prisma'
import { currencyWith, percent } from '@/lib/utils'
import { addPayment, deletePayment, deleteUnitAction, updatePayment, updateUnitFull } from '@/lib/actions'
import Link from 'next/link'
import ConfirmSubmit from '@/components/ConfirmSubmit'

export default async function UnitDetail({ params, searchParams }: { params: { id: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const id = Number(params.id)
  const unit = await prisma.unit.findUnique({ where: { id }, include: { client: true, payments: { orderBy: { date: 'asc' } } } })
  if (!unit) return <div>Njësia nuk u gjet</div>
  const [settings, clients, blocks] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.client.findMany({ orderBy: { fullName: 'asc' } }),
    prisma.block.findMany({ orderBy: { name: 'asc' } })
  ])
  const success = typeof searchParams.success === 'string' ? searchParams.success : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined

  // Server action wrappers for TS
  async function savePayment(formData: FormData): Promise<void> {
    'use server'
    await updatePayment(formData)
  }
  async function removePayment(formData: FormData): Promise<void> {
    'use server'
    await deletePayment(formData)
  }
  async function addPaymentAction(formData: FormData): Promise<void> {
    'use server'
    await addPayment(formData)
  }
  async function saveUnitFull(formData: FormData): Promise<void> {
    'use server'
    await updateUnitFull(formData)
  }
  async function removeUnit(formData: FormData): Promise<void> {
    'use server'
    await deleteUnitAction(formData)
  }

  return (
    <div>
      <PageHeader title={`Njësia ${unit.block}-${unit.apartmentNumber || unit.listNumber || unit.id}`} breadcrumb={[{ href: '/units', label: 'Njësitë' }]} />

      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">U ruajt me sukses.</div>}
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Informacion bazë</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><div className="text-gray-500">Blloku</div><div className="font-medium">{unit.block}</div></div>
              <div><div className="text-gray-500">Kati</div><div className="font-medium">{unit.floor ?? '-'}</div></div>
              <div><div className="text-gray-500">Apartamenti</div><div className="font-medium">{unit.apartmentNumber ?? '-'}</div></div>
              <div><div className="text-gray-500">Sipërfaqja m²</div><div className="font-medium">{unit.areaM2 ?? '-'}</div></div>
              <div><div className="text-gray-500">Çmimi/m²</div><div className="font-medium">{currencyWith(unit.pricePerM2, settings || undefined)}</div></div>
              <div><div className="text-gray-500">Vlera totale</div><div className="font-medium">{currencyWith(unit.totalPrice, settings || undefined)}</div></div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Pagesat</h2>
              <div className="text-xs flex items-center gap-2">
                <a href={`/api/export/payments?unitId=${unit.id}`} className="rounded-md border px-2 py-1 text-gray-700">Eksporto pagesat CSV</a>
                <a href={`/api/export/invoices?unitId=${unit.id}`} className="rounded-md border px-2 py-1 text-gray-700">Eksporto faturat CSV</a>
              </div>
            </div>
            <ul className="mt-3 space-y-3">
              {unit.payments.map((p) => (
                <li key={p.id} className="rounded-md border p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 text-sm items-end">
                    <form action={savePayment} className="contents">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="unitId" value={unit.id} />
                      <input type="hidden" name="clientId" value={unit.clientId || ''} />
                      <Input label="Përshkrimi" name="label" defaultValue={p.label || ''} />
                      <Input label="Data" name="date" type="date" defaultValue={p.date ? new Date(p.date).toISOString().slice(0,10) : ''} />
                      <Input label="Shuma (€)" name="amount" type="number" step="0.01" defaultValue={p.amount} />
                      <div className="sm:col-span-2 flex gap-2">
                        <Button type="submit">Ruaj</Button>
                      </div>
                    </form>
                    <div className="sm:col-span-6 flex justify-end">
                      <form action={removePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="unitId" value={unit.id} />
                        <ConfirmSubmit message="Të fshihet kjo pagesë?" className="rounded-md bg-red-600 px-3 py-2 text-white text-sm">Fshi</ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
              {unit.payments.length === 0 && <div className="text-sm text-gray-500">Nuk ka pagesa ende.</div>}
            </ul>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Shto pagesë</h2>
            <form action={addPaymentAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="hidden" name="unitId" value={unit.id} />
              <input type="hidden" name="clientId" value={unit.clientId || ''} />
              <Input label="Përshkrimi" name="label" defaultValue="Pagesë" />
              <Input label="Data" name="date" type="date" />
              <Input label="Shuma (€)" name="amount" type="number" step="0.01" required />
              <div className="sm:col-span-4"><Button type="submit">Shto</Button></div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Klienti</h2>
            {unit.client ? (
              <div className="mt-2 text-sm">
                <div className="font-medium"><Link href={`/clients/${unit.client.id}`} className="text-brand hover:underline">{unit.client.fullName}</Link></div>
                <div className="text-gray-500">{unit.client.phone || '-'}</div>
                <div className="text-gray-500">{unit.client.residence || '-'}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 mt-2">Nuk ka klient të lidhur.</div>
            )}
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Përmbledhje</h2>
            <div className="mt-2 text-sm space-y-1">
              <div className="flex justify-between"><span>Totali i paguar</span><span className="font-medium">{currencyWith(unit.totalPaid, settings || undefined)}</span></div>
              <div className="flex justify-between"><span>E mbetur</span><span className="font-medium">{currencyWith(unit.remainingDebt, settings || undefined)}</span></div>
              <div className="flex justify-between"><span>Progresi</span><span className="font-medium">{percent(unit.paymentProgress)}</span></div>
            </div>
            <div className="mt-3">
              <Link href={`/invoices/new?unitId=${unit.id}`} className="text-sm text-brand hover:underline">Krijo faturë</Link>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Përpuno njësinë</h2>
            <form action={saveUnitFull} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={unit.id} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {blocks.length > 0 ? (
                <Select label="Blloku" name="block" defaultValue={unit.block}>
                  {blocks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </Select>
              ) : (
                <Input label="Block" name="block" defaultValue={unit.block} />
              )}
                <Select label="Lloji" name="type" defaultValue={unit.type}>
                  <option value="APARTMENT">APARTMENT</option>
                  <option value="LOCAL">LOCAL</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input label="Numri i listës" name="listNumber" type="number" defaultValue={unit.listNumber ?? ''} />
                <Input label="Kati" name="floor" type="number" defaultValue={unit.floor ?? ''} />
                <Input label="Apartamenti" name="apartmentNumber" defaultValue={unit.apartmentNumber ?? ''} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input label="Sipërfaqja m²" name="areaM2" type="number" step="0.01" defaultValue={unit.areaM2 ?? ''} />
                <Input label="Çmimi/m² (€)" name="pricePerM2" type="number" step="0.01" defaultValue={unit.pricePerM2 ?? ''} />
                <Input label="Vlera totale (€)" name="totalPrice" type="number" step="0.01" defaultValue={unit.totalPrice ?? ''} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Data e shitjes" name="saleDate" type="date" defaultValue={unit.saleDate ? new Date(unit.saleDate).toISOString().slice(0,10) : ''} />
                <Input label="Kontrata" name="contractInfo" defaultValue={unit.contractInfo ?? ''} />
              </div>
              <Textarea label="Komente" name="comments" defaultValue={unit.comments ?? ''} />
              <Select label="Klienti" name="clientId" defaultValue={unit.clientId ?? ''}>
                <option value="">Pa caktuar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </Select>
              <Button type="submit">Ruaj</Button>
            </form>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">Zonë e rrezikshme</h2>
            <form action={removeUnit} className="mt-3">
              <input type="hidden" name="id" value={unit.id} />
              <ConfirmSubmit message="Jeni i sigurt që doni ta fshini këtë njësi?" className="rounded-md bg-red-600 px-3 py-2 text-sm text-white">Fshi njësinë</ConfirmSubmit>
            </form>
            <div className="mt-2 text-xs text-gray-500">Fshirja bllokohet nëse ka pagesa ose fatura.</div>
          </section>
        </aside>
      </div>
    </div>
  )
}
