'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

export function useAdmin() {
  const searchParams = useSearchParams()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  const verify = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const { ok } = await res.json()
      if (ok) {
        localStorage.setItem('admin_token', token)
        setIsAdmin(true)
      } else {
        localStorage.removeItem('admin_token')
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    const urlToken = searchParams.get('token')
    const storedToken = localStorage.getItem('admin_token')
    const tokenToCheck = urlToken || storedToken
    if (tokenToCheck) {
      verify(tokenToCheck).finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [searchParams, verify])

  const adminFetch = useCallback((url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token') || ''
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
        ...(options.headers || {}),
      },
    })
  }, [])

  return { isAdmin, checking, adminFetch }
}
