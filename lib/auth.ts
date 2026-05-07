import { NextRequest } from 'next/server'

export function isAdmin(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return !!token && token === process.env.ADMIN_SECRET_TOKEN
}

export function isAdminToken(token: string | null): boolean {
  if (!token) return false
  return token === process.env.ADMIN_SECRET_TOKEN
}
