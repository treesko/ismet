import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cookieHeader = (request.headers.get('cookie') || '')
  const token = cookieHeader.split(/;\s*/).find(p => p.startsWith('session='))?.split('=')[1]
  const secret = process.env.SESSION_SECRET || 'change-me-in-production'
  const session = await verifySession(token, secret)
  return NextResponse.json({ hasCookie: Boolean(token), valid: Boolean(session), session })
}

