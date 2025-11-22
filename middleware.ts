import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

// Protect everything except login, public assets, and public APIs
const exemptPaths = [
  '/login',
  '/api/login',
  '/api/logout',
  '/api/me',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow static files and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/public') ||
    exemptPaths.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('session')?.value
  const secret = process.env.SESSION_SECRET || 'change-me-in-production'
  const session = await verifySession(token, secret)
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const res = NextResponse.redirect(url)
    // Clear possibly invalid cookie
    res.cookies.set('session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
