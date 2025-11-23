import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const MobileNav = dynamic(() => import('@/components/MobileNav'), { ssr: false })
const TopNav = dynamic(() => import('@/components/TopNav'), { ssr: false })
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false })

export const metadata: Metadata = {
  title: 'Apartment Sales Manager',
  description: 'Manage apartment sales, clients, payments and invoices.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900">
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3 md:gap-6">
            <Link href="/" className="text-lg font-semibold bg-gradient-to-r from-brand to-accent-purple bg-clip-text text-transparent">IsmetCOM</Link>
            <TopNav />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/logout" className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800">Logout</a>
            </div>
          </div>
        </header>
        <main className="app-main mx-auto max-w-7xl px-4 py-6">{children}</main>
        {/* Mobile bottom nav */}
        <MobileNav />
      </body>
    </html>
  )
}
