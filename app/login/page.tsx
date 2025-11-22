import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = searchParams?.next || '/'
  const error = searchParams?.error
  return (
    <div className="mx-auto mt-20 max-w-sm rounded-lg border bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">Invalid credentials</div>}
      <div className="mb-3 text-xs text-gray-500">If you get redirected back here, check `SESSION_SECRET`, `ADMIN_USER` and `ADMIN_PASS` env vars are set, then try again. You can also test at <a className="text-brand hover:underline" href="/api/me" target="_blank">/api/me</a>.</div>
      <form method="post" action="/api/login" className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="block text-sm text-gray-700">Username</label>
          <input name="username" className="mt-1 w-full rounded border px-3 py-2" autoComplete="username" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" autoComplete="current-password" required />
        </div>
        <button type="submit" className="w-full rounded bg-brand px-3 py-2 text-white">Sign in</button>
      </form>
    </div>
  )
}
