import PageHeader from '@/components/PageHeader'
import { Button, Input, Select, Textarea } from '@/components/forms'
import { prisma } from '@/lib/prisma'
import { createUnit } from '@/lib/actions'

export default async function NewUnitPage() {
  const [clients, blocks] = await Promise.all([
    prisma.client.findMany({ orderBy: { fullName: 'asc' } }),
    prisma.block.findMany({ orderBy: { name: 'asc' } })
  ])
  const today = new Date().toISOString().slice(0,10)
  return (
    <div>
      <PageHeader title="Njësi e re" breadcrumb={[{ href: '/units', label: 'Njësitë' }]} />
      {(() => {
        async function createUnitAction(formData: FormData): Promise<void> {
          'use server'
          await createUnit(formData)
        }
        return (
          <form action={createUnitAction} className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {blocks.length > 0 ? (
                <Select label="Blloku" name="block" required>
                  <option value="">Zgjidh bllokun</option>
                  {blocks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </Select>
              ) : (
                <Input label="Blloku" name="block" placeholder="p.sh., 7A" required />
              )}
              <Input label="Numri i listës (Nr)" name="listNumber" type="number" />
              <Input label="Kati" name="floor" type="number" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input label="Numri i apartamentit" name="apartmentNumber" />
              <Input label="Sipërfaqja m²" name="areaM2" type="number" step="0.01" />
              <Input label="Çmimi/m² (€)" name="pricePerM2" type="number" step="0.01" />
            </div>
            <Input label="Vlera totale (€)" name="totalPrice" type="number" step="0.01" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Data e shitjes" name="saleDate" type="date" defaultValue={today} />
              <Input label="Kontrata" name="contractInfo" />
            </div>
            <Textarea label="Komente" name="comments" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Lloji" name="type" defaultValue={'APARTMENT'}>
                <option value="APARTMENT">APARTMENT</option>
                <option value="LOCAL">LOCAL</option>
              </Select>
              <Select label="Klienti (opsional)" name="clientId" defaultValue="">
                <option value="">Pa caktuar</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </Select>
            </div>
            <Button type="submit">Krijo njësinë</Button>
          </form>
        )
      })()}
    </div>
  )
}
