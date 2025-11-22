import PageHeader from '@/components/PageHeader'
import { prisma } from '@/lib/prisma'
import { Button, Input, Textarea } from '@/components/forms'
import { saveSettings } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const s = await prisma.settings.findUnique({ where: { id: 1 } })
  const success = typeof searchParams.success === 'string' ? searchParams.success : undefined
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined
  return (
    <div>
      <PageHeader title="Parametrat" />
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">U ruajt me sukses.</div>}
      <form action={saveSettings} className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-white p-4">
        <Input label="Emri i kompanisë" name="companyName" defaultValue={s?.companyName ?? ''} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Adresa 1" name="address1" defaultValue={s?.address1 ?? ''} />
          <Input label="Adresa 2" name="address2" defaultValue={s?.address2 ?? ''} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Qyteti" name="city" defaultValue={s?.city ?? ''} />
          <Input label="Shteti/Vendi" name="country" defaultValue={s?.country ?? ''} />
          <Input label="NIPT / Nr. tatimor" name="taxId" defaultValue={s?.taxId ?? ''} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Email" name="email" defaultValue={s?.email ?? ''} />
          <Input label="Telefoni" name="phone" defaultValue={s?.phone ?? ''} />
          <Input label="URL e logos" name="logoUrl" defaultValue={s?.logoUrl ?? ''} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Kodi i monedhës" name="currencyCode" defaultValue={s?.currencyCode ?? 'EUR'} />
          <Input label="Gjuha (locale)" name="locale" defaultValue={s?.locale ?? 'de-DE'} />
          <Input label="Formati i numërimit të faturave" name="invoiceNumberFormat" defaultValue={s?.invoiceNumberFormat ?? 'YYYYMM-####'} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Formati i datës" name="dateFormat" defaultValue={s?.dateFormat ?? 'dd/MM/yyyy'} />
        </div>
        <Button type="submit">Ruaj</Button>
      </form>
    </div>
  )
}
