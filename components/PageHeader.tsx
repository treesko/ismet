import Link from 'next/link'

type Crumb = { href: string, label: string }

export default function PageHeader({ title, breadcrumb }: { title: string, breadcrumb?: Crumb[] }) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="text-sm text-gray-500 mb-2">
          {breadcrumb.map((c, i) => (
            <span key={i}>
              <Link href={c.href} className="hover:underline">{c.label}</Link>
              {i < breadcrumb.length - 1 && <span className="mx-1">/</span>}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-accent-purple bg-clip-text text-transparent">{title}</h1>
    </div>
  )
}
