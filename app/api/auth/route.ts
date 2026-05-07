import { NextRequest, NextResponse } from 'next/server'
import { isAdminToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { token } = await request.json()
  if (isAdminToken(token)) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: false }, { status: 401 })
}
