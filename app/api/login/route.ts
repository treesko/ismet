import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const form = await request.formData()
  const username = String(form.get('username') || '')
  const password = String(form.get('password') || '')
  const next = String(form.get('next') || '/')

  const ADMIN_USER = process.env.ADMIN_USER || ''
  const ADMIN_PASS = process.env.ADMIN_PASS || ''
  if (!ADMIN_USER || !ADMIN_PASS) {
    return new NextResponse('Auth is not configured', { status: 500 })
  }
  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, request.url), { status: 302 })
  }

  const maxAgeDays = 30
  const payload = {
    sub: ADMIN_USER,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeDays * 24 * 60 * 60,
  }
  const secret = process.env.SESSION_SECRET || 'change-me-in-production'
  const token = await signSession(payload, secret)

  const res = NextResponse.redirect(new URL(next || '/', request.url), { status: 303 })
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeDays * 24 * 60 * 60,
  })
  return res
}
