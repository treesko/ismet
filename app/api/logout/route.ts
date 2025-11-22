import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  cookies().set('session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return NextResponse.redirect(new URL('/login', request.url), { status: 302 })
}

export async function POST(request: Request) {
  return GET(request)
}
