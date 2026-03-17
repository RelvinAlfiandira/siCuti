'use client'
// app/providers.jsx
// SessionProvider harus di client component terpisah

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
