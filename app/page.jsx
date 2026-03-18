'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      if (session.user.role === 'KEPALA_SEKOLAH') {
        router.push('/ks/dashboard')
      } else {
        router.push('/guru/dashboard')
      }
    }
  }, [status, session])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f3f4f6',
    }}>
      <p style={{ fontSize: '14px', color: '#6b7280' }}>Memuat...</p>
    </div>
  )
}