import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Apartment Sales Manager',
  description: 'Manage apartment sales, clients, payments and invoices.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center gap-3 md:gap-6">
            <Link href="/" className="text-lg font-semibold text-brand">IsmetCOM</Link>
            <nav className="flex-1 min-w-0 flex items-center gap-4 text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
              <Link href="/units" className="hover:text-gray-900">Njësitë</Link>
              <Link href="/blocks" className="hover:text-gray-900">Blloqet</Link>
              <Link href="/clients" className="hover:text-gray-900">Klientët</Link>
              <Link href="/invoices" className="hover:text-gray-900">Faturat</Link>
              <Link href="/admin/import" className="hover:text-gray-900">Import</Link>
              <Link href="/admin/exports" className="hover:text-gray-900">Eksportet</Link>
              <Link href="/settings" className="hover:text-gray-900">Parametrat</Link>
            </nav>
            <a href="/api/logout" className="ml-auto rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Logout</a>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
