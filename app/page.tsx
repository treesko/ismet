import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { prisma } from '@/lib/prisma'
import { currencyWith, formatDateWith } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const n = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    return { start: m, end: n, key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}` }
  })

  const [settings, unitsCount, soldUnitsCount, sums, byBlock, invoicesPaid, invoicesPartial, invoicesUnpaid, overdue, upcoming, recentPayments, topClients, invoicedThisMonth, collectedThisMonth, newClientsThisMonth, invoicesTrend, paymentsTrend] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.unit.count(),
    prisma.unit.count({ where: { OR: [{ totalPrice: { gt: 0 } }, { clientId: { not: null } }] } }),
    prisma.unit.aggregate({ _sum: { totalPrice: true, totalPaid: true, remainingDebt: true } }),
    prisma.unit.groupBy({ by: ['block'], _count: { _all: true }, _sum: { remainingDebt: true, totalPrice: true, totalPaid: true } }),
    prisma.invoice.count({ where: { remainingOnInvoice: 0 } }),
    prisma.invoice.count({ where: { AND: [{ totalPaidOnInvoice: { gt: 0 } }, { remainingOnInvoice: { gt: 0 } }] } }),
    prisma.invoice.count({ where: { totalPaidOnInvoice: 0 } }),
    prisma.invoice.findMany({ where: { remainingOnInvoice: { gt: 0 }, dueDate: { lt: now } }, include: { client: true, unit: true }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.invoice.findMany({ where: { remainingOnInvoice: { gt: 0 }, dueDate: { gte: now, lte: in30 } }, include: { client: true, unit: true }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.payment.findMany({ include: { client: true, unit: true }, orderBy: [{ date: 'desc' }, { id: 'desc' }], take: 5 }),
    (async () => {
      const byClient = await prisma.unit.groupBy({ by: ['clientId'], where: { clientId: { not: null } }, _sum: { remainingDebt: true } })
      const top = byClient.filter(x => x.clientId !== null).sort((a, b) => (b._sum.remainingDebt || 0) - (a._sum.remainingDebt || 0)).slice(0, 5)
      const clients = await prisma.client.findMany({ where: { id: { in: top.map(t => t.clientId as number) } } })
      const nameMap = new Map(clients.map(c => [c.id, c.fullName]))
      return top.map(t => ({ clientId: t.clientId as number, name: nameMap.get(t.clientId as number) || `Client ${t.clientId}`, remaining: t._sum.remainingDebt || 0 }))
    })(),
    prisma.invoice.aggregate({ _sum: { subtotal: true }, where: { issueDate: { gte: monthStart, lt: nextMonthStart } } }).then(r => r._sum.subtotal || 0),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lt: nextMonthStart } } }).then(r => r._sum.amount || 0),
    prisma.client.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart } } }),
    Promise.all(monthRanges.map(async (r) => (await prisma.invoice.aggregate({ _sum: { subtotal: true }, where: { issueDate: { gte: r.start, lt: r.end } } }))._sum.subtotal || 0)),
    Promise.all(monthRanges.map(async (r) => (await prisma.payment.aggregate({ _sum: { amount: true }, where: { date: { gte: r.start, lt: r.end } } }))._sum.amount || 0)),
  ])

  const totalExpected = sums._sum.totalPrice || 0
  const totalPaid = sums._sum.totalPaid || 0
  const totalRemaining = sums._sum.remainingDebt || 0
  const collectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0
  const overdueTotal = overdue.reduce((s, i) => s + (i.remainingOnInvoice || 0), 0)
  const netChange = collectedThisMonth - invoicedThisMonth

  return (
    <div>
      <PageHeader title="Paneli" />

      {/* Tregues kryesorë */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Totali i njësive" value={unitsCount} href="/units" color="emerald" />
        <StatCard label="Njësitë e shitura" value={soldUnitsCount} href="/units?sold=1" color="amber" />
        <StatCard label="Të ardhura të pritshme" value={currencyWith(totalExpected, settings || undefined)} href="/units" color="purple" />
        <StatCard label="Totali i paguar" value={currencyWith(totalPaid, settings || undefined)} sublabel={`Mbetur ${currencyWith(totalRemaining, settings || undefined)}`} href="/invoices" />
      </div>

      {/* Collections progress */}
      <div className="mt-4 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Progresi i arkëtimit</div>
          <div className="text-sm font-medium">{collectionRate.toFixed(1)}%</div>
        </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-100">
        <div className="h-2 bg-brand" style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }} />
      </div>
    </div>

      {/* Ky muaj */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <a href={`/invoices?start=${monthStart.toISOString().slice(0,10)}&end=${nextMonthStart.toISOString().slice(0,10)}`} className="card block transition hover:shadow-lg">
          <div className="card-content">
          <div className="text-sm text-gray-500">Faturuar (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{currencyWith(invoicedThisMonth, settings || undefined)}</div>
          </div>
        </a>
        <a href={`/payments?start=${monthStart.toISOString().slice(0,10)}&end=${nextMonthStart.toISOString().slice(0,10)}`} className="card block transition hover:shadow-lg">
          <div className="card-content">
          <div className="text-sm text-gray-500">Arkëtuar (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{currencyWith(collectedThisMonth, settings || undefined)}</div>
          </div>
        </a>
        <a href={`/clients?start=${monthStart.toISOString().slice(0,10)}&end=${nextMonthStart.toISOString().slice(0,10)}`} className="card block transition hover:shadow-lg">
          <div className="card-content">
          <div className="text-sm text-gray-500">Klientë të rinj (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{newClientsThisMonth}</div>
          </div>
        </a>
        <div className="card">
          <div className="card-content">
          <div className="text-sm text-gray-500">Ndryshimi neto</div>
          <div className={`mt-1 text-2xl font-semibold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currencyWith(netChange, settings || undefined)}</div>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="card-content">
          <div className="text-sm font-medium">Faturat 6 muajt e fundit</div>
          <div className="mt-3 flex items-end gap-2">
            {invoicesTrend.map((v, i) => {
              const max = Math.max(...invoicesTrend, 1)
              const h = Math.round((v / (max || 1)) * 60)
              return <div key={i} title={`${monthRanges[i].key}: ${v}`} className="w-6 bg-brand/60" style={{ height: `${h}px` }} />
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">{monthRanges.map(m => m.key).join('  ')}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
          <div className="text-sm font-medium">Arkëtimet 6 muajt e fundit</div>
          <div className="mt-3 flex items-end gap-2">
            {paymentsTrend.map((v, i) => {
              const max = Math.max(...paymentsTrend, 1)
              const h = Math.round((v / (max || 1)) * 60)
              return <div key={i} title={`${monthRanges[i].key}: ${v}`} className="w-6 bg-brand" style={{ height: `${h}px` }} />
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">{monthRanges.map(m => m.key).join('  ')}</div>
          </div>
        </div>
      </div>

      {/* Ky muaj (kartat pa link) */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Faturuar (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{currencyWith(invoicedThisMonth, settings || undefined)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Arkëtuar (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{currencyWith(collectedThisMonth, settings || undefined)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Klientë të rinj (këtë muaj)</div>
          <div className="mt-1 text-2xl font-semibold">{newClientsThisMonth}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Ndryshimi neto</div>
          <div className={`mt-1 text-2xl font-semibold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currencyWith(netChange, settings || undefined)}</div>
        </div>
      </div>

      {/* Trends */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium">Faturat 6 muajt e fundit</div>
          <div className="mt-3 flex items-end gap-2">
            {invoicesTrend.map((v, i) => {
              const max = Math.max(...invoicesTrend, 1)
              const h = Math.round((v / (max || 1)) * 60)
              return <div key={i} title={`${monthRanges[i].key}: ${v}`} className="w-6 bg-brand/60" style={{ height: `${h}px` }} />
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">{monthRanges.map(m => m.key).join('  ')}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium">Arkëtimet 6 muajt e fundit</div>
          <div className="mt-3 flex items-end gap-2">
            {paymentsTrend.map((v, i) => {
              const max = Math.max(...paymentsTrend, 1)
              const h = Math.round((v / (max || 1)) * 60)
              return <div key={i} title={`${monthRanges[i].key}: ${v}`} className="w-6 bg-brand" style={{ height: `${h}px` }} />
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">{monthRanges.map(m => m.key).join('  ')}</div>
        </div>
      </div>

      {/* Invoices summary */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Fatura të paguara</div>
          <div className="mt-1 text-2xl font-semibold">
            <a href="/invoices?status=Paid" className="hover:underline text-brand">{invoicesPaid}</a>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Fatura pjesërisht</div>
          <div className="mt-1 text-2xl font-semibold">
            <a href="/invoices?status=Partial" className="hover:underline text-brand">{invoicesPartial}</a>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Fatura të papaguara</div>
          <div className="mt-1 text-2xl font-semibold">
            <a href="/invoices?status=Unpaid" className="hover:underline text-brand">{invoicesUnpaid}</a>
          </div>
        </div>
      </div>

      {/* Two-column: Overdue + Upcoming, Recent payments */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="text-lg font-medium">Faturat në vështrim</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Me vonesë</div>
                <div className="flex items-center gap-3 text-sm">
                  <a className="text-brand hover:underline" href="/invoices?due=overdue">Shiko të gjitha</a>
                  <a className="rounded-md border px-2 py-1 text-xs" href="/api/export/overdue">Eksporto CSV</a>
                  <span className="text-gray-600">Totali {currencyWith(overdueTotal, settings || undefined)}</span>
                </div>
              </div>
              <ul className="mt-2 divide-y rounded-md border">
                {overdue.length === 0 && <div className="p-3 text-sm text-gray-500">S’ka vonesa.</div>}
                {overdue.map(i => (
                  <li key={i.id} className="p-3 text-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{i.client.fullName}</div>
                      <div className="text-gray-500">Njësia {i.unit.block}-{i.unit.apartmentNumber || i.unit.listNumber || i.unitId} • Afati {formatDateWith(i.dueDate, settings || undefined)}</div>
                    </div>
                    <div className="font-medium">{currencyWith(i.remainingOnInvoice, settings || undefined)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Afat 30 ditë</div>
                <div className="flex items-center gap-3 text-sm">
                  <a className="text-brand hover:underline" href="/invoices?due=next30">Shiko të gjitha</a>
                  <a className="rounded-md border px-2 py-1 text-xs" href="/api/export/next30">Eksporto CSV</a>
                </div>
              </div>
              <ul className="mt-2 divide-y rounded-md border">
                {upcoming.length === 0 && <div className="p-3 text-sm text-gray-500">S’ka afate të ardhshme.</div>}
                {upcoming.map(i => (
                    <li key={i.id} className="p-3 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{i.client.fullName}</div>
                        <div className="text-gray-500">Njësia {i.unit.block}-{i.unit.apartmentNumber || i.unit.listNumber || i.unitId} • Afati {formatDateWith(i.dueDate, settings || undefined)}</div>
                      </div>
                      <div className="font-medium">{currencyWith(i.remainingOnInvoice, settings || undefined)}</div>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Pagesat e fundit</h2>
          <ul className="mt-3 divide-y">
            {recentPayments.length === 0 && <div className="text-sm text-gray-500">S’ka pagesa të fundit.</div>}
            {recentPayments.map(p => (
              <li key={p.id} className="py-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.client.fullName}</div>
                  <div className="text-gray-500">{formatDateWith(p.date, settings || undefined)} • Njësia {p.unit.block}-{p.unit.apartmentNumber || p.unit.listNumber || p.unitId}</div>
                </div>
                <div className="font-medium">{currencyWith(p.amount, settings || undefined)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Sipas bllokut & Klientët kryesorë */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="text-lg font-medium">Sipas bllokut</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {byBlock.map(b => {
              const exp = b._sum.totalPrice || 0
              const paid = b._sum.totalPaid || 0
              const rem = b._sum.remainingDebt || 0
              const rate = exp > 0 ? (paid / exp) * 100 : 0
              return (
                <a key={b.block} href={`/units?block=${encodeURIComponent(b.block)}`} className="rounded-md border p-4 transition hover:shadow-md block">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Blloku {b.block}</div>
                    <div className="text-xs text-gray-500">{b._count._all} njësi</div>
                  </div>
                  <div className="mt-2 text-sm">Paguar {currencyWith(paid, settings || undefined)} / {currencyWith(exp, settings || undefined)}</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-100">
                    <div className="h-2 bg-brand" style={{ width: `${Math.min(100, Math.max(0, rate))}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Mbetur {currencyWith(rem, settings || undefined)}</div>
                </a>
              )
            })}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Klientët kryesorë (sipas mbetjes)</h2>
          <div className="mt-1 text-sm"><a className="rounded-md border px-2 py-1 text-xs" href="/api/export/top-clients">Eksporto CSV</a></div>
          <ul className="mt-3 divide-y">
            {topClients.length === 0 && <div className="text-sm text-gray-500">No clients.</div>}
            {topClients.map(c => (
              <li key={c.clientId} className="py-2 text-sm flex items-center justify-between transition hover:bg-gray-50">
                <a href={`/clients/${c.clientId}`} className="font-medium text-brand hover:underline">{c.name}</a>
                <div className="font-medium">{currencyWith(c.remaining, settings || undefined)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
