import PageHeader from '@/components/PageHeader'
import { prisma } from '@/lib/prisma'
import { currencyWith, formatDateWith } from '@/lib/utils'
import { Button, Input, Select, Textarea } from '@/components/forms'
import { addAllocation, deleteAllocationAction, deleteInvoiceAction, updateInvoice } from '@/lib/actions'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import PrintButton from '@/components/PrintButton'

export default async function InvoiceDetail({ params, searchParams }: { params: { id: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const id = Number(params.id)
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { client: true, unit: true } })
  if (!inv) return <div>Fatura nuk u gjet</div>
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  const clients = await prisma.client.findMany({ orderBy: { fullName: 'asc' } })
  const units = await prisma.unit.findMany({ orderBy: [{ block: 'asc' }, { listNumber: 'asc' }] })
  const success = typeof searchParams.success === 'string' ? searchParams.success : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined

  // Compute applied payments to this invoice using the same FIFO allocation as actions
  const payments = await prisma.payment.findMany({ where: { unitId: inv.unitId }, orderBy: [{ date: 'asc' }, { id: 'asc' }] })
  const allInvoices = await prisma.invoice.findMany({ where: { unitId: inv.unitId }, orderBy: [{ issueDate: 'asc' }, { id: 'asc' }] })
  const allocations = await prisma.paymentAllocation.findMany({ where: { invoiceId: inv.id }, include: { payment: true } })
  const remainingByInvoice = new Map<number, number>(allInvoices.map(i => [i.id, i.subtotal || 0]))
  const contributions: Record<number, { id: number, date: Date | null, label?: string | null, amount: number }[]> = {}
  for (const i of allInvoices) contributions[i.id] = []
  let invIdx = 0
  for (const p of payments) {
    let amountLeft = p.amount || 0
    while (amountLeft > 0 && invIdx < allInvoices.length) {
      const curInv = allInvoices[invIdx]
      const rem = remainingByInvoice.get(curInv.id) || 0
      if (rem <= 0.000001) { invIdx++; continue }
      const use = Math.min(amountLeft, rem)
      contributions[curInv.id].push({ id: p.id, date: p.date ?? null, label: p.label, amount: use })
      remainingByInvoice.set(curInv.id, rem - use)
      amountLeft -= use
      if (remainingByInvoice.get(curInv.id)! <= 0.000001) { invIdx++ }
    }
    if (invIdx >= allInvoices.length) break
  }
  // Combine explicit allocations for this invoice with FIFO remainder for display
  const explicitApplied = allocations.map(a => ({ id: a.id, date: a.payment.date ?? null, label: a.payment.label, amount: a.amount }))
  const fifoApplied = contributions[inv.id] || []
  const appliedToThis = [...explicitApplied, ...fifoApplied]
  const appliedSum = appliedToThis.reduce((s, c) => s + (c.amount || 0), 0)

  // Server action wrappers for TS
  async function saveInvoice(formData: FormData): Promise<void> {
    'use server'
    await updateInvoice(formData)
  }
  async function addAlloc(formData: FormData): Promise<void> {
    'use server'
    await addAllocation(formData)
  }
  async function delAlloc(formData: FormData): Promise<void> {
    'use server'
    await deleteAllocationAction(formData)
  }

  return (
    <div>
      <PageHeader title={`Fatura ${inv.invoiceNumber}`} breadcrumb={[{ href: '/invoices', label: 'Faturat' }]} />
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">U ruajt me sukses.</div>}
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="rounded-lg border bg-white p-6 print:p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-start gap-3">
              {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />}
              <div className="text-2xl font-semibold">{settings?.companyName || 'Company Name'}</div>
            </div>
            {settings?.address1 && <div className="text-sm text-gray-500">{settings.address1}</div>}
            {(settings?.city || settings?.country) && <div className="text-sm text-gray-500">{[settings?.city, settings?.country].filter(Boolean).join(', ')}</div>}
            {settings?.email && <div className="text-sm text-gray-500">Email: {settings.email}</div>}
            {settings?.phone && <div className="text-sm text-gray-500">Phone: {settings.phone}</div>}
            {settings?.taxId && <div className="text-sm text-gray-500">Tax ID: {settings.taxId}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 flex items-center gap-2 justify-end">
              <span>Fatura</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${inv.remainingOnInvoice === 0 ? 'bg-green-100 text-green-700' : inv.totalPaidOnInvoice > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                {inv.remainingOnInvoice === 0 ? 'Paguar' : inv.totalPaidOnInvoice > 0 ? 'Pjesërisht' : 'Pa paguar'}
              </span>
            </div>
            <div className="text-xl font-semibold">{inv.invoiceNumber}</div>
            <div className="text-sm">Issue: {formatDateWith(inv.issueDate, settings || undefined)}</div>
            <div className="text-sm">Due: {formatDateWith(inv.dueDate, settings || undefined)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Faturuar për</div>
            <div className="text-sm">{inv.client.fullName}</div>
            <div className="text-sm text-gray-500">{inv.client.residence || '-'}</div>
            <div className="text-sm text-gray-500">{inv.client.phone || '-'}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Njësia</div>
            <div className="text-sm">{inv.unit.block}-{inv.unit.apartmentNumber || inv.unit.listNumber || inv.unitId}</div>
            <div className="text-sm text-gray-500">Sipërfaqe {inv.unit.areaM2 ?? '-'} m² • Çmimi/m² {currencyWith(inv.unit.pricePerM2, settings || undefined)}</div>
            <div className="text-sm text-gray-500">Vlera totale e njësisë {currencyWith(inv.unit.totalPrice, settings || undefined)}</div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Përshkrimi</th>
                <th className="px-3 py-2 text-right">Shuma</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2">Njësia {inv.unit.block}-{inv.unit.apartmentNumber || inv.unit.listNumber || inv.unitId}</td>
                <td className="px-3 py-2 text-right">{currencyWith(inv.subtotal, settings || undefined)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-sm rounded-md border p-3 text-sm">
            <div className="flex justify-between"><span>Nëntotali</span><span>{currencyWith(inv.subtotal, settings || undefined)}</span></div>
            <div className="flex justify-between"><span>Paguar në faturë</span><span>{currencyWith(inv.totalPaidOnInvoice, settings || undefined)}</span></div>
            <div className="flex justify-between font-medium"><span>E mbetur</span><span>{currencyWith(inv.remainingOnInvoice, settings || undefined)}</span></div>
          </div>
        </div>

        {/* Pagesat e aplikuara */}
        <div className="mt-4 rounded-md border p-3 text-sm">
          <div className="font-medium mb-2">Pagesat e aplikuara</div>
          {appliedToThis.length === 0 ? (
            <div className="text-gray-500">Nuk ka pagesa të aplikuara.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Data</th>
                    <th className="px-3 py-2 text-left">Përshkrimi</th>
                    <th className="px-3 py-2 text-right">Aplikuar</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedToThis.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2">{formatDateWith(c.date, settings || undefined)}</td>
                      <td className="px-3 py-2 text-gray-700">{c.label || '-'}</td>
                      <td className="px-3 py-2 text-right">{currencyWith(c.amount, settings || undefined)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-medium">
                    <td className="px-3 py-2" colSpan={2}>Totali i aplikuar</td>
                    <td className="px-3 py-2 text-right">{currencyWith(appliedSum, settings || undefined)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 no-print">
          <PrintButton className="rounded-md bg-brand px-3 py-2 text-white">Printo / Shkarko PDF</PrintButton>
          <a href={`/api/pdf/invoice/${inv.id}`} className="rounded-md border px-3 py-2">Shkarko PDF (server)</a>
        </div>
      </div>

      {/* Alokimet e pagesave */}
      <section className="mt-6 rounded-lg border bg-white p-4 no-print">
          <h2 className="text-lg font-medium">Alokimet e pagesave</h2>
        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Pagesa</th>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-right">Alokuar</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 && (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={4}>S’ka alokime. Shtoni më poshtë për të anashkaluar FIFO.</td></tr>
              )}
              {allocations.map(a => (
                <tr key={a.id}>
                  <td className="px-3 py-2">{a.payment.label || '-'} (#{a.payment.id})</td>
                  <td className="px-3 py-2">{formatDateWith(a.payment.date, settings || undefined)}</td>
                  <td className="px-3 py-2 text-right">{currencyWith(a.amount, settings || undefined)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={delAlloc}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white">Hiqe</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium">Shto / përditëso alokimin</h3>
          <form action={addAlloc} className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input type="hidden" name="invoiceId" value={inv.id} />
            <select name="paymentId" className="rounded-md border px-3 py-2 sm:col-span-3" required>
              <option value="">Zgjidh pagesën</option>
              {payments.map(p => (
                <option key={p.id} value={p.id}>{p.label || `Pagesa ${p.id}`} • {formatDateWith(p.date, settings || undefined)} • {currencyWith(p.amount, settings || undefined)}</option>
              ))}
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Shuma" className="rounded-md border px-3 py-2" required />
            <button className="rounded-md bg-brand px-3 py-2 text-white">Ruaj alokimin</button>
          </form>
          <div className="mt-2 text-xs text-gray-500">Shumat e alokuara zvogëlojnë FIFO; totalet llogariten automatikisht.</div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 no-print">
        <section className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="text-lg font-medium">Përpuno faturën</h2>
          <form action={saveInvoice} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={inv.id} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Klienti" name="clientId" defaultValue={inv.clientId} required>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </Select>
              <Select label="Njësia" name="unitId" defaultValue={inv.unitId} required>
                {units.map(u => <option key={u.id} value={u.id}>{u.block}-{u.apartmentNumber || u.listNumber || u.id}</option>)}
              </Select>
            </div>
            <Input label="Numri i faturës" name="invoiceNumber" defaultValue={inv.invoiceNumber} required />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Data e lëshimit" name="issueDate" type="date" defaultValue={new Date(inv.issueDate).toISOString().slice(0,10)} required />
              <Input label="Afati i pagesës" name="dueDate" type="date" defaultValue={new Date(inv.dueDate).toISOString().slice(0,10)} required />
            </div>
            <Input label="Shuma (€)" name="subtotal" type="number" step="0.01" defaultValue={inv.subtotal} required />
            <Textarea label="Shënime" name="notes" defaultValue={inv.notes || ''} />
            <Button type="submit">Ruaj</Button>
          </form>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Zonë e rrezikshme</h2>
          <form action={deleteInvoiceAction} className="mt-3">
            <input type="hidden" name="id" value={inv.id} />
            <ConfirmSubmit message="Të fshihet kjo faturë?" className="rounded-md bg-red-600 px-3 py-2 text-sm text-white">Fshi faturën</ConfirmSubmit>
          </form>
        </section>
      </div>
    </div>
  )
}
