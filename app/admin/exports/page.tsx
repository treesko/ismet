import PageHeader from '@/components/PageHeader'

export default function ExportsPage() {
  return (
    <div>
      <PageHeader title="Eksportet" breadcrumb={[{ href: '/', label: 'Paneli' }]} />
      <div className="mb-4 text-sm"><a href="/admin/exports/snapshot" className="rounded-md border px-3 py-2">Pamje mujore</a></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Faturat</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href="/api/export/invoices" className="text-brand hover:underline">Të gjitha faturat (CSV)</a></li>
            <li><a href="/api/export/overdue" className="text-brand hover:underline">Fatura me vonesë (CSV)</a></li>
            <li><a href="/api/export/next30" className="text-brand hover:underline">Fatura me afat 30 ditë (CSV)</a></li>
          </ul>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Njësitë & Klientët</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href="/api/export/units" className="text-brand hover:underline">Njësitë (CSV)</a></li>
            <li><a href="/api/export/clients" className="text-brand hover:underline">Klientët (CSV)</a></li>
          </ul>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Pagesat</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href="/api/export/payments" className="text-brand hover:underline">Pagesat (CSV)</a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}
