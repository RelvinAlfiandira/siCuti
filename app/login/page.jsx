'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email atau password salah')
      return
    }

    // Redirect berdasarkan role
    const res = await fetch('/api/auth/session')
    const session = await res.json()

    if (session?.user?.role === 'KEPALA_SEKOLAH') {
      router.push('/ks/dashboard')
    } else {
      router.push('/guru/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        background: '#fff',
        border: '0.5px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: '#dbeafe',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6' }}></div>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>SiCuti</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Sistem Pengajuan Cuti Guru</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@sekolah.sch.id"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '0.5px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '0.5px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '0.5px solid #fecaca',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#dc2626',
              marginBottom: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? '#9ca3af' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Info akun test */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#6b7280',
        }}>
          <div style={{ fontWeight: '500', marginBottom: '6px', color: '#374151' }}>Akun untuk testing:</div>
          <div>Guru: budi@sekolah.sch.id</div>
          <div>KS: ks@sekolah.sch.id</div>
          <div style={{ marginTop: '4px' }}>Password: <strong>password123</strong></div>
        </div>
      </div>
    </div>
  )
}
