import Link from 'next/link'

export default function StatCard({ label, value, sublabel, href }: { label: string, value: string | number, sublabel?: string, href?: string }) {
  const content = (
    <div className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}
