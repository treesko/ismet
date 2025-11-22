import Link from 'next/link'

export default function StatCard({ label, value, sublabel, href, color = 'brand' }: { label: string, value: string | number, sublabel?: string, href?: string, color?: 'brand' | 'purple' | 'emerald' | 'amber' }) {
  const gradient = color === 'purple' ? 'from-accent-purple to-brand' : color === 'emerald' ? 'from-emerald-500 to-brand' : color === 'amber' ? 'from-accent-amber to-brand' : 'from-brand to-accent-pink'
  const content = (
    <div className={`rounded-xl p-4 text-white shadow-card transition hover:shadow-lg bg-gradient-to-br ${gradient}`}>
      <div className="text-sm/5 opacity-90">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sublabel && <div className="text-xs/5 opacity-80 mt-1">{sublabel}</div>}
    </div>
  )
  return href ? <Link href={href} className="block">{content}</Link> : content
}
