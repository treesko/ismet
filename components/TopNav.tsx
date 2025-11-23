"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/units', label: 'Njësitë', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10h7v10H4V10Zm9 0h7v10h-7V10Zm3-8h-2v5h2V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  )},
  { href: '/blocks', label: 'Blloqet', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16v4H4V7Zm0 6h16v4H4v-4Z" stroke="currentColor" strokeWidth="1.5"/></svg>
  )},
  { href: '/clients', label: 'Klientët', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 7a3.5 3.5 0 1 1-7.001 0A3.5 3.5 0 0 1 15.5 7ZM5 20a7 7 0 1 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { href: '/invoices', label: 'Faturat', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3h8l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { href: '/admin/import', label: 'Import', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { href: '/admin/exports', label: 'Eksportet', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21V9m0 0-4 4m4-4 4 4M4 5h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )},
  { href: '/settings', label: 'Parametrat', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15c.09-.33.14-.68.14-1.04 0-.36-.05-.71-.14-1.04l2.04-1.58-2-3.46-2.4.96c-.54-.44-1.17-.78-1.86-.98L15 4h-6l-.18 2.86c-.69.2-1.32.54-1.86.98l-2.4-.96-2 3.46L4.6 12.9c-.09.33-.14.68-.14 1.05 0 .36.05.71.14 1.04L2.56 16.6l2 3.46 2.4-.96c.54.44 1.17.78 1.86.98L9 22h6l.18-2.86c.69-.2 1.32-.54 1.86-.98l2.4.96 2-3.46L19.4 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  )},
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden sm:flex flex-1 min-w-0 items-center gap-1 text-sm text-gray-600">
      {links.map(({ href, label, icon }) => {
        const active = pathname === href || pathname?.startsWith(href)
        return (
          <Link key={href} href={href} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-slate-100 ${active ? 'text-brand bg-slate-100' : ''}`}>
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

