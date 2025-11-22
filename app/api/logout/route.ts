import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/login', request.url), { status: 302 })
  res.cookies.set('session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}

export async function POST(request: Request) {
  return GET(request)
}

