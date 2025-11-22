import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/forms'
import { importExcelAction } from '@/lib/actions'

// Wrap to satisfy TS: form action expects Promise<void>
async function uploadAction(formData: FormData): Promise<void> {
  'use server'
  await importExcelAction(formData)
}

export default function ImportPage({ searchParams }: { searchParams: { success?: string, error?: string, units?: string, clients?: string } }) {
  const success = searchParams?.success
  const error = searchParams?.error
  const units = searchParams?.units
  const clients = searchParams?.clients
  return (
    <div>
      <PageHeader title="Import Excel" breadcrumb={[{ href: '/', label: 'Paneli' }]} />
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Import i suksesshëm{(units || clients) ? `: ${units || 0} njësi, ${clients || 0} klientë` : ''}.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Dështoi importi: {decodeURIComponent(error)}
        </div>
      )}
      <form action={uploadAction} className="max-w-lg space-y-4 rounded-lg border bg-white p-4" encType="multipart/form-data">
        <div className="text-sm text-gray-600">
          Ngarko një skedar .xlsx. Emri i çdo flete bëhet Bllok (p.sh. "Banesat 7A" → blloku "7A").
        </div>
        <input type="file" name="file" accept=".xlsx" required className="w-full rounded-md border px-3 py-2" />
        <Button type="submit">Importo</Button>
      </form>
      <div className="mt-4 text-sm text-gray-500">
        Pas importit do të shfaqen të dhënat e përditësuara në panel.
      </div>
    </div>
  )
}
