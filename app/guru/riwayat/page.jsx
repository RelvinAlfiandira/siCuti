'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatTgl(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function StatusBadge({ status }) {
  const map = {
    APPROVED: { label: 'Disetujui', bg: '#dcfce7', color: '#16a34a' },
    REJECTED: { label: 'Ditolak', bg: '#fef2f2', color: '#dc2626' },
    PENDING: { label: 'Menunggu', bg: '#fef3c7', color: '#d97706' },
    CANCELLED: { label: 'Dibatalkan', bg: '#f3f4f6', color: '#6b7280' },
  }
  const s = map[status] || map.PENDING
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '500', background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

export default function RiwayatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pengajuan, setPengajuan] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('SEMUA')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') fetchData()
  }, [status])

  async function fetchData() {
    try {
      const res = await fetch('/api/cuti')
      const data = await res.json()
      setPengajuan(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'SEMUA'
    ? pengajuan
    : pengajuan.filter(p => p.status === filter)

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Memuat data...</p>
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
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>SiCuti</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['Beranda', 'Ajukan Cuti', 'Riwayat'].map((item, i) => (
            <button key={i} onClick={() => {
              if (item === 'Beranda') router.push('/guru/dashboard')
              if (item === 'Ajukan Cuti') router.push('/guru/ajukan')
            }} style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: item === 'Riwayat' ? '#f3f4f6' : 'transparent',
              fontSize: '13px', fontWeight: item === 'Riwayat' ? '500' : '400',
              color: '#374151', cursor: 'pointer',
            }}>{item}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{session?.user?.nama}</span>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '600', color: '#2563eb',
          }}>
            {session?.user?.nama?.charAt(0)}
          </div>
          <button onClick={() => import('next-auth/react').then(m => m.signOut({ callbackUrl: '/login' }))}
            style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            Keluar
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
              Riwayat pengajuan cuti
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              Total {pengajuan.length} pengajuan
            </p>
          </div>
          <button
            onClick={() => router.push('/guru/ajukan')}
            style={{
              padding: '8px 18px', background: '#111827', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >
            + Ajukan Cuti
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {['SEMUA', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter === f ? '#111827' : '#e5e7eb',
              background: filter === f ? '#111827' : '#fff',
              color: filter === f ? '#fff' : '#6b7280',
              fontWeight: filter === f ? '500' : '400',
            }}>
              {f === 'SEMUA' ? 'Semua' : f === 'PENDING' ? 'Menunggu' : f === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
              {' '}
              <span style={{ opacity: 0.7 }}>
                ({f === 'SEMUA' ? pengajuan.length : pengajuan.filter(p => p.status === f).length})
              </span>
            </button>
          ))}
        </div>

        {/* Tabel */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.8fr 1fr 1.4fr 0.5fr 1fr 1fr',
            gap: '8px', padding: '10px 16px',
            fontSize: '11px', fontWeight: '500', color: '#6b7280',
            borderBottom: '0.5px solid #e5e7eb', background: '#f9fafb',
          }}>
            <span>Tanggal</span>
            <span>Jenis</span>
            <span>Diajukan</span>
            <span>Hari</span>
            <span>Status</span>
            <span>Surat</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
              Tidak ada pengajuan
            </div>
          ) : (
            filtered.map((p, i) => (
              <div key={p.id} style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 1.4fr 0.5fr 1fr 1fr',
                gap: '8px', padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '0.5px solid #f3f4f6' : 'none',
                alignItems: 'center', fontSize: '12px',
              }}>
                <div>
                  <div style={{ color: '#111827', fontWeight: '500' }}>
                    {formatTgl(p.tanggalMulai)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    s/d {formatTgl(p.tanggalSelesai)}
                  </div>
                </div>
                <span style={{ color: '#6b7280' }}>
                  {p.jenisCuti.charAt(0) + p.jenisCuti.slice(1).toLowerCase()}
                </span>
                <span style={{ color: '#9ca3af' }}>
                  {formatTgl(p.createdAt)}
                </span>
                <span style={{ color: '#374151', fontWeight: '500' }}>
                  {p.jumlahHari}
                </span>
                <div>
                  <StatusBadge status={p.status} />
                  {p.status === 'REJECTED' && p.catatanKs && (
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>
                      {p.catatanKs}
                    </div>
                  )}
                </div>
                <div>
                  {p.status === 'APPROVED' && p.suratUrl ? (
                    <a
                      href={p.suratUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', padding: '5px 12px',
                        background: '#eff6ff', color: '#2563eb',
                        border: '0.5px solid #bfdbfe', borderRadius: '6px',
                        fontSize: '11px', fontWeight: '500', textDecoration: 'none',
                      }}
                    >
                      Unduh PDF
                    </a>
                  ) : p.status === 'APPROVED' ? (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Proses...</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Catatan */}
        <div style={{
          marginTop: '14px', padding: '12px 14px',
          background: '#f9fafb', border: '0.5px solid #e5e7eb',
          borderRadius: '8px', fontSize: '12px', color: '#6b7280', lineHeight: '1.6',
        }}>
          Surat keterangan cuti digenerate otomatis setelah disetujui dan dikirim ke email Anda.
          Klik "Unduh PDF" untuk mengunduh ulang.
        </div>

      </div>
    </div>
  )
}