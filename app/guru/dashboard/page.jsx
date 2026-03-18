'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GuruDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [kuota, setKuota] = useState(null)
  const [pengajuan, setPengajuan] = useState([])
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') fetchData()
  }, [status])

  async function fetchData() {
    try {
      const [kuotaRes, pengajuanRes, notifRes] = await Promise.all([
        fetch('/api/kuota'),
        fetch('/api/cuti'),
        fetch('/api/notifikasi'),
      ])
      const kuotaData = await kuotaRes.json()
      const pengajuanData = await pengajuanRes.json()
      const notifData = await notifRes.json()
      setKuota(kuotaData)
      setPengajuan(pengajuanData)
      setNotifikasi(notifData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Memuat data...</p>
    </div>
  )

  const pengajuanAktif = pengajuan.find(p => p.status === 'PENDING')
  const riwayat = pengajuan.filter(p => p.status !== 'PENDING').slice(0, 3)
  const sisaKuota = kuota ? kuota.totalKuota - kuota.terpakai - kuota.pending : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff',
        borderBottom: '0.5px solid #e5e7eb',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: '#dbeafe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }}></div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Management Cuti</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['Beranda', 'Ajukan Cuti', 'Riwayat'].map((item, i) => (
            <button key={i} onClick={() => {
              if (item === 'Ajukan Cuti') router.push('/guru/ajukan')
              if (item === 'Riwayat') router.push('/guru/riwayat')
            }} style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: item === 'Beranda' ? '#f3f4f6' : 'transparent',
              fontSize: '13px',
              fontWeight: item === 'Beranda' ? '500' : '400',
              color: '#374151',
              cursor: 'pointer',
            }}>{item}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{session?.user?.nama}</span>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#dbeafe', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#2563eb'
          }}>
            {session?.user?.nama?.charAt(0)}
          </div>
          <button onClick={() => { import('next-auth/react').then(m => m.signOut({ callbackUrl: '/login' })) }}
            style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
            Keluar
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
            Selamat datang, {session?.user?.nama?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Sisa kuota cuti', value: `${sisaKuota} hari`, color: '#111827' },
            { label: 'Total kuota', value: `${kuota?.totalKuota || 12} hari`, color: '#111827' },
            { label: 'Sudah dipakai', value: `${kuota?.terpakai || 0} hari`, color: '#111827' },
            { label: 'Sedang pending', value: `${kuota?.pending || 0} hari`, color: kuota?.pending > 0 ? '#d97706' : '#111827' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Pengajuan Aktif */}
          <div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Pengajuan aktif</span>
                {pengajuanAktif && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#d97706', fontWeight: '500' }}>Menunggu KS</span>}
              </div>
              <div style={{ padding: '16px' }}>
                {pengajuanAktif ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                      {pengajuanAktif.jenisCuti.charAt(0) + pengajuanAktif.jenisCuti.slice(1).toLowerCase()} · {pengajuanAktif.jumlahHari} hari
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                      {new Date(pengajuanAktif.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                      {new Date(pengajuanAktif.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {['Diajukan', 'Review KS', 'Diproses', 'Selesai'].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: '600',
                              background: i === 0 ? '#dcfce7' : i === 1 ? '#dbeafe' : '#f3f4f6',
                              color: i === 0 ? '#16a34a' : i === 1 ? '#2563eb' : '#9ca3af',
                              border: i === 0 ? '1.5px solid #86efac' : i === 1 ? '1.5px solid #93c5fd' : '0.5px solid #e5e7eb',
                            }}>
                              {i === 0 ? '✓' : i + 1}
                            </div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', whiteSpace: 'nowrap' }}>{step}</div>
                          </div>
                          {i < 3 && <div style={{ flex: 1, height: '1.5px', background: i === 0 ? '#86efac' : '#e5e7eb', margin: '0 4px', marginBottom: '14px' }}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Tidak ada pengajuan aktif</div>
                    <button onClick={() => router.push('/guru/ajukan')} style={{
                      padding: '8px 20px', background: '#111827', color: '#fff',
                      border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
                    }}>
                      + Ajukan Cuti
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notifikasi */}
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Notifikasi terbaru</span>
              </div>
              {notifikasi.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Belum ada notifikasi</div>
              ) : (
                notifikasi.slice(0, 3).map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '0.5px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{n.judul}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{n.pesan}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Riwayat + Kuota Bar */}
          <div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Riwayat cuti</span>
                <button onClick={() => router.push('/guru/riwayat')} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Lihat semua →</button>
              </div>
              {riwayat.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Belum ada riwayat</div>
              ) : (
                riwayat.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr 0.8fr', gap: '8px', padding: '10px 16px', borderBottom: i < riwayat.length - 1 ? '0.5px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#111827' }}>
                      {new Date(p.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                      {new Date(p.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ color: '#6b7280' }}>{p.jenisCuti.charAt(0) + p.jenisCuti.slice(1).toLowerCase()}</span>
                    <span style={{ color: '#374151' }}>{p.jumlahHari}h</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', textAlign: 'center',
                      background: p.status === 'APPROVED' ? '#dcfce7' : p.status === 'REJECTED' ? '#fef2f2' : '#fef3c7',
                      color: p.status === 'APPROVED' ? '#16a34a' : p.status === 'REJECTED' ? '#dc2626' : '#d97706',
                    }}>
                      {p.status === 'APPROVED' ? 'Disetujui' : p.status === 'REJECTED' ? 'Ditolak' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Kuota Bar */}
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '14px' }}>Kuota cuti {new Date().getFullYear()}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                <span>Terpakai {kuota?.terpakai || 0} dari {kuota?.totalKuota || 12} hari</span>
                <span>{Math.round(((kuota?.terpakai || 0) / (kuota?.totalKuota || 12)) * 100)}%</span>
              </div>
              <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ width: `${((kuota?.terpakai || 0) / (kuota?.totalKuota || 12)) * 100}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Sisa', value: sisaKuota, color: '#16a34a' },
                  { label: 'Dipakai', value: kuota?.terpakai || 0, color: '#374151' },
                  { label: 'Pending', value: kuota?.pending || 0, color: '#d97706' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
