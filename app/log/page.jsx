'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('SEMUA')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') fetchLogs()
  }, [status])

  async function fetchLogs() {
    try {
      const res = await fetch('/api/log')
      const data = await res.json()
      setLogs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'SEMUA' ? logs : logs.filter(l => l.status === filter)

  const sukses = logs.filter(l => l.status === 'SUCCESS').length
  const gagal = logs.filter(l => l.status === 'FAILED').length

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Memuat log...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '0.5px solid #e5e7eb',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: '#dbeafe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }}></div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Management Cuti</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => {
            session?.user?.role === 'KEPALA_SEKOLAH'
              ? router.push('/ks/dashboard')
              : router.push('/guru/dashboard')
          }} style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: 'transparent', fontSize: '13px', color: '#374151', cursor: 'pointer',
          }}>Dashboard</button>
          <button style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: '#f3f4f6', fontSize: '13px', fontWeight: '500', color: '#374151', cursor: 'pointer',
          }}>Log Sistem</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{session?.user?.nama}</span>
          <button onClick={() => import('next-auth/react').then(m => m.signOut({ callbackUrl: '/login' }))}
            style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            Keluar
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Log eksekusi workflow</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Rekam jejak semua proses otomatis yang berjalan di sistem</p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total log', value: logs.length, color: '#111827' },
            { label: 'Sukses', value: sukses, color: '#16a34a' },
            { label: 'Gagal', value: gagal, color: '#dc2626' },
            { label: 'Sukses rate', value: logs.length > 0 ? `${Math.round((sukses / logs.length) * 100)}%` : '0%', color: '#2563eb' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          {['SEMUA', 'SUCCESS', 'FAILED', 'INFO'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter === f ? '#111827' : '#e5e7eb',
              background: filter === f ? '#111827' : '#fff',
              color: filter === f ? '#fff' : '#6b7280',
              fontWeight: filter === f ? '500' : '400',
            }}>
              {f === 'SEMUA' ? 'Semua' : f === 'SUCCESS' ? 'Sukses' : f === 'FAILED' ? 'Gagal' : 'Info'}
              {' '}({f === 'SEMUA' ? logs.length : logs.filter(l => l.status === f).length})
            </button>
          ))}
          <button onClick={fetchLogs} style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            border: '0.5px solid #e5e7eb', background: '#fff',
            fontSize: '12px', color: '#6b7280', cursor: 'pointer',
          }}>
            Refresh
          </button>
        </div>

        {/* Log Table */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.2fr 0.6fr 1fr',
            gap: '8px', padding: '10px 16px',
            fontSize: '11px', fontWeight: '500', color: '#6b7280',
            borderBottom: '0.5px solid #e5e7eb', background: '#f9fafb',
          }}>
            <span>Waktu</span><span>Flow</span><span>Step</span><span>Durasi</span><span>Status</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
              Tidak ada log
            </div>
          ) : (
            filtered.map((l, i) => (
              <div key={l.id} style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.2fr 0.6fr 1fr',
                gap: '8px', padding: '10px 16px',
                borderBottom: i < filtered.length - 1 ? '0.5px solid #f3f4f6' : 'none',
                alignItems: 'center', fontSize: '12px',
              }}>
                <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '11px' }}>
                  {new Date(l.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span style={{ color: '#374151', fontWeight: '500' }}>{l.namaFlow}</span>
                <span style={{ color: '#6b7280' }}>{l.namaStep}</span>
                <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px' }}>
                  {l.durasi ? `${l.durasi}ms` : '—'}
                </span>
                <div>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500',
                    background: l.status === 'SUCCESS' ? '#dcfce7' : l.status === 'FAILED' ? '#fef2f2' : '#eff6ff',
                    color: l.status === 'SUCCESS' ? '#16a34a' : l.status === 'FAILED' ? '#dc2626' : '#2563eb',
                  }}>
                    {l.status}
                  </span>
                  {l.status === 'FAILED' && l.pesan && (
                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px', lineHeight: '1.3' }}>
                      {l.pesan.slice(0, 60)}...
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}