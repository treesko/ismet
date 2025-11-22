import PageHeader from '@/components/PageHeader'
import { Button, Input, Select, Textarea } from '@/components/forms'
import { prisma } from '@/lib/prisma'
import { createInvoice } from '@/lib/actions'

export default async function NewInvoice({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const unitId = typeof searchParams.unitId === 'string' ? Number(searchParams.unitId) : undefined
  const clientId = typeof searchParams.clientId === 'string' ? Number(searchParams.clientId) : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined

  const clients = await prisma.client.findMany({ include: { units: true } })
  let units = await prisma.unit.findMany({ include: { client: true } })

  const defaultUnit = unitId ? await prisma.unit.findUnique({ where: { id: unitId }, include: { client: true } }) : null
  const defaultClientId = clientId || defaultUnit?.clientId || undefined
  if (defaultClientId) {
    units = units.filter(u => u.clientId === defaultClientId)
  }

  const today = new Date()
  const due = new Date()
  due.setDate(today.getDate() + 30)

  return (
    <div>
      <PageHeader title="Faturë e re" breadcrumb={[{ href: '/invoices', label: 'Faturat' }]} />
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}
      {(() => {
        async function createInvoiceAction(formData: FormData): Promise<void> {
          'use server'
          await createInvoice(formData)
        }
        return (
          <form action={createInvoiceAction} className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Klienti" name="clientId" defaultValue={defaultClientId} required>
                <option value="">Zgjidh klientin</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </Select>
              <Select label="Njësia" name="unitId" defaultValue={defaultUnit?.id} required>
                <option value="">Zgjidh njësinë</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.block}-{u.apartmentNumber || u.listNumber || u.id} ({u.client?.fullName || 'No client'})</option>
                ))}
              </Select>
            </div>
            <Input label="Numri i faturës (opsional)" name="invoiceNumber" placeholder="Gjenerohet automatikisht nëse lihet bosh" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Data e lëshimit" name="issueDate" type="date" defaultValue={today.toISOString().slice(0,10)} required />
              <Input label="Afati i pagesës" name="dueDate" type="date" defaultValue={due.toISOString().slice(0,10)} required />
            </div>
            <Input label="Shuma (€)" name="subtotal" type="number" step="0.01" defaultValue={defaultUnit?.remainingDebt ?? ''} required />
            <Textarea label="Shënime" name="notes" />
            <Button type="submit">Krijo faturën</Button>
          </form>
        )
      })()}
    </div>
  )
}
