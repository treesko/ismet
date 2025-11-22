import PageHeader from '@/components/PageHeader'
import { Button, Input } from '@/components/forms'
import { createClient } from '@/lib/actions'

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="Klient i ri" breadcrumb={[{ href: '/clients', label: 'Klientët' }]} />
      {(() => {
        async function createAction(formData: FormData): Promise<void> {
          'use server'
          await createClient(formData)
        }
        return (
          <form action={createAction} className="mx-auto max-w-lg space-y-3 rounded-lg border bg-white p-4">
            <Input label="Emri i plotë" name="fullName" required />
            <Input label="Vendbanimi" name="residence" />
            <Input label="Telefoni" name="phone" />
            <Input label="Email" name="email" type="email" />
            <Button type="submit">Krijo</Button>
          </form>
        )
      })()}
    </div>
  )
}
