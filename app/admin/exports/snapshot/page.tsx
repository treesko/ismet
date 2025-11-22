import PageHeader from '@/components/PageHeader'

export default async function SnapshotExports() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const start = monthStart.toISOString().slice(0,10)
  const end = nextMonthStart.toISOString().slice(0,10)
  return (
    <div>
      <PageHeader title="Pamje mujore e eksporteve" breadcrumb={[{ href: '/admin/exports', label: 'Eksportet' }]} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Faturat</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href={`/api/export/invoices?start=${start}&end=${end}`} className="text-brand hover:underline">Fatura të lëshuara këtë muaj (CSV)</a></li>
            <li><a href="/api/export/overdue" className="text-brand hover:underline">Fatura me vonesë (CSV)</a></li>
            <li><a href="/api/export/next30" className="text-brand hover:underline">Fatura me afat 30 ditë (CSV)</a></li>
          </ul>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Pagesat & Klientët</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href={`/api/export/payments?start=${start}&end=${end}`} className="text-brand hover:underline">Pagesa të marra këtë muaj (CSV)</a></li>
            <li><a href={`/api/export/clients?start=${start}&end=${end}`} className="text-brand hover:underline">Klientë të krijuar këtë muaj (CSV)</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}
