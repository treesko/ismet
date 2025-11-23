"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Ballina', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={active ? 'text-brand' : 'text-gray-500'}><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  )},
  { href: '/units', label: 'Njësitë', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={active ? 'text-brand' : 'text-gray-500'}><path d="M4 10h7v10H4V10Zm9 0h7v10h-7V10Zm3-8h-2v5h2V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  )},
  { href: '/invoices', label: 'Faturat', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={active ? 'text-brand' : 'text-gray-500'}><path d="M7 3h8l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { href: '/clients', label: 'Klientët', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={active ? 'text-brand' : 'text-gray-500'}><path d="M15.5 7a3.5 3.5 0 1 1-7.001 0A3.5 3.5 0 0 1 15.5 7ZM5 20a7 7 0 1 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { href: '/settings', label: 'Parametrat', icon: (active: boolean) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={active ? 'text-brand' : 'text-gray-500'}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M19.4 15c.09-.33.14-.68.14-1.04 0-.36-.05-.71-.14-1.04l2.04-1.58-2-3.46-2.4.96c-.54-.44-1.17-.78-1.86-.98L15 4h-6l-.18 2.86c-.69.2-1.32.54-1.86.98l-2.4-.96-2 3.46L4.6 12.9c-.09.33-.14.68-.14 1.05 0 .36.05.71.14 1.04L2.56 16.6l2 3.46 2.4-.96c.54.44 1.17.78 1.86.98L9 22h6l.18-2.86c.69-.2 1.32-.54 1.86-.98l2.4.96 2-3.46L19.4 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
  )},
]

export default function MobileNav() {
  const pathname = usePathname() || '/'
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-2 py-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center py-1.5 text-[11px]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-brand/10' : ''}`}>{item.icon(active)}</div>
              <div className={active ? 'text-brand' : 'text-gray-600'}>{item.label}</div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
