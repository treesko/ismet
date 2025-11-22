import PageHeader from '@/components/PageHeader'
import { prisma } from '@/lib/prisma'
import { Button, Input } from '@/components/forms'
import { createBlock, deleteBlockAction } from '@/lib/actions'
import ConfirmSubmit from '@/components/ConfirmSubmit'

export const dynamic = 'force-dynamic'

export default async function BlocksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined
  const blocks = await prisma.block.findMany({ orderBy: { name: 'asc' } })
  // Count units per block name
  const counts = Object.fromEntries(
    await Promise.all(blocks.map(async (b) => [b.name, await prisma.unit.count({ where: { block: b.name } })]))
  ) as Record<string, number>

  return (
    <div>
      <PageHeader title="Blloqet" breadcrumb={[{ href: '/', label: 'Paneli' }]} />
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Shto bllok</h2>
          <form action={createBlock} className="mt-3 flex gap-2">
            <Input label="Emri" name="name" placeholder="p.sh., 7A, 7B, Blloku C" required />
            <div className="self-end"><Button type="submit">Shto</Button></div>
          </form>
          <div className="mt-2 text-xs text-gray-500">Emri duhet të jetë unik.</div>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-medium">Blloqet ekzistuese</h2>
          <ul className="mt-3 divide-y">
            {blocks.length === 0 && <div className="text-sm text-gray-500">S’ka blloqe të shtuara.</div>}
            {blocks.map(b => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-gray-500">{counts[b.name] ?? 0} njësi</div>
                </div>
                <form action={deleteBlockAction}>
                  <input type="hidden" name="name" value={b.name} />
                  <ConfirmSubmit message="Të fshihet ky bllok?" className="rounded-md bg-red-600 px-3 py-2 text-white text-xs" disabled={(counts[b.name] ?? 0) > 0}>Fshi</ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
