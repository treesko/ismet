import PageHeader from '@/components/PageHeader'
import { Button, Input } from '@/components/forms'
import { createClient } from '@/lib/actions'

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="New Client" breadcrumb={[{ href: '/clients', label: 'Clients' }]} />
      <form action={createClient} className="mx-auto max-w-lg space-y-3 rounded-lg border bg-white p-4">
        <Input label="Full name" name="fullName" required />
        <Input label="Residence" name="residence" />
        <Input label="Phone" name="phone" />
        <Input label="Email" name="email" type="email" />
        <Button type="submit">Create</Button>
      </form>
    </div>
  )
}

