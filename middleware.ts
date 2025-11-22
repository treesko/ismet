import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPrefixes = ['/admin', '/blocks', '/settings']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = protectedPrefixes.some(p => pathname.startsWith(p))
  if (!needsAuth) return NextResponse.next()

  const user = process.env.ADMIN_USER || ''
  const pass = process.env.ADMIN_PASS || ''
  if (!user || !pass) return NextResponse.next()

  const auth = req.headers.get('authorization') || ''
  const toB64 = (s: string) => (typeof btoa === 'function' ? btoa(s) : Buffer.from(s).toString('base64'))
  const expected = 'Basic ' + toB64(`${user}:${pass}`)
  if (auth !== expected) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Restricted"' }
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/public).*)'],
}
