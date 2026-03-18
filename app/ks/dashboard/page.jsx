'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function formatTgl(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function KsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pengajuan, setPengajuan] = useState([])
  const [notifikasi, setNotifikasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { id, action: 'approve'|'reject' }
  const [catatan, setCatatan] = useState('')
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      if (session.user.role !== 'KEPALA_SEKOLAH') router.push('/guru/dashboard')
      else fetchData()
    }
  }, [status])

  async function fetchData() {
    try {
      const [pengajuanRes, notifRes] = await Promise.all([
        fetch('/api/cuti'),
        fetch('/api/notifikasi'),
      ])
      setPengajuan(await pengajuanRes.json())
      setNotifikasi(await notifRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleKeputusan() {
    if (!modal) return
    if (modal.action === 'reject' && !catatan) {
      alert('Alasan penolakan wajib diisi')
      return
    }

    setProcessing(true)
    try {
      const endpoint = modal.action === 'approve'
        ? `/api/cuti/${modal.id}/approve`
        : `/api/cuti/${modal.id}/reject`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatan }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setToast(modal.action === 'approve' ? 'Cuti berhasil disetujui! Email & surat dikirim otomatis.' : 'Pengajuan berhasil ditolak.')
      setTimeout(() => setToast(''), 4000)
      setModal(null)
      setCatatan('')
      fetchData()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Memuat data...</p>
    </div>
  )

  const pending = pengajuan.filter(p => p.status === 'PENDING')
  const riwayat = pengajuan.filter(p => p.status !== 'PENDING')
  const disetujuiBulanIni = riwayat.filter(p => {
    return p.status === 'APPROVED' && new Date(p.approvedAt).getMonth() === new Date().getMonth()
  }).length
  const ditolakBulanIni = riwayat.filter(p => {
    return p.status === 'REJECTED' && new Date(p.approvedAt).getMonth() === new Date().getMonth()
  }).length

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: '10px',
          padding: '12px 16px', fontSize: '13px', color: '#16a34a', fontWeight: '500',
          maxWidth: '360px',
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Modal Konfirmasi */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '24px',
            width: '100%', maxWidth: '420px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 8px' }}>
              {modal.action === 'approve' ? 'Setujui pengajuan cuti?' : 'Tolak pengajuan cuti?'}
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px', lineHeight: '1.5' }}>
              {modal.action === 'approve'
                ? 'Setelah disetujui, sistem akan otomatis mengurangi kuota, generate surat PDF, dan mengirim email ke guru.'
                : 'Guru akan mendapat notifikasi penolakan beserta alasan yang kamu tulis.'}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                {modal.action === 'approve' ? 'Catatan (opsional)' : 'Alasan penolakan *'}
              </label>
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder={modal.action === 'approve' ? 'Tambahkan catatan...' : 'Tulis alasan penolakan...'}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '0.5px solid #d1d5db', borderRadius: '8px',
                  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  resize: 'vertical', color: '#111827',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setModal(null); setCatatan('') }}
                disabled={processing}
                style={{
                  flex: 1, padding: '9px', background: 'transparent',
                  border: '0.5px solid #d1d5db', borderRadius: '8px',
                  fontSize: '13px', color: '#374151', cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleKeputusan}
                disabled={processing}
                style={{
                  flex: 2, padding: '9px',
                  background: processing ? '#9ca3af' : modal.action === 'approve' ? '#16a34a' : '#dc2626',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '500', cursor: processing ? 'not-allowed' : 'pointer',
                }}
              >
                {processing ? 'Memproses...' : modal.action === 'approve' ? 'Ya, setujui' : 'Ya, tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '20px', fontWeight: '500' }}>Kepala Sekolah</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{session?.user?.nama}</span>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '600', color: '#d97706',
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
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
            Dashboard Kepala Sekolah
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Menunggu review', value: pending.length, color: pending.length > 0 ? '#d97706' : '#111827' },
            { label: 'Disetujui bulan ini', value: disetujuiBulanIni, color: '#16a34a' },
            { label: 'Ditolak bulan ini', value: ditolakBulanIni, color: '#dc2626' },
            { label: 'Total pengajuan', value: pengajuan.length, color: '#111827' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{m.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

          {/* Tabel Pending */}
          <div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Menunggu persetujuan</span>
                {pending.length > 0 && (
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#d97706', fontWeight: '500' }}>
                    {pending.length} pending
                  </span>
                )}
              </div>

              {pending.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                  Tidak ada pengajuan yang menunggu
                </div>
              ) : (
                <>
                  {/* Header tabel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.4fr 0.5fr 1.2fr', gap: '8px', padding: '8px 16px', fontSize: '11px', fontWeight: '500', color: '#6b7280', borderBottom: '0.5px solid #f3f4f6' }}>
                    <span>Nama guru</span><span>Jenis</span><span>Tanggal</span><span>Hari</span><span>Aksi</span>
                  </div>
                  {pending.map((p, i) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.4fr 0.5fr 1.2fr', gap: '8px', padding: '12px 16px', borderBottom: i < pending.length - 1 ? '0.5px solid #f9fafb' : 'none', alignItems: 'center', fontSize: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{p.guru?.nama}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.guru?.mapel}</div>
                      </div>
                      <span style={{ color: '#6b7280' }}>
                        {p.jenisCuti.charAt(0) + p.jenisCuti.slice(1).toLowerCase()}
                      </span>
                      <span style={{ color: '#6b7280' }}>
                        {formatTgl(p.tanggalMulai)} – {formatTgl(p.tanggalSelesai)}
                      </span>
                      <span style={{ color: '#374151', fontWeight: '500' }}>{p.jumlahHari}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => { setModal({ id: p.id, action: 'approve' }); setCatatan('') }}
                          style={{
                            padding: '5px 10px', background: '#f0fdf4',
                            color: '#16a34a', border: '0.5px solid #86efac',
                            borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                          }}
                        >
                          Setuju
                        </button>
                        <button
                          onClick={() => { setModal({ id: p.id, action: 'reject' }); setCatatan('') }}
                          style={{
                            padding: '5px 10px', background: 'transparent',
                            color: '#dc2626', border: '0.5px solid #fca5a5',
                            borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                          }}
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Riwayat keputusan */}
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Riwayat keputusan</span>
              </div>
              {riwayat.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Belum ada riwayat</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 0.5fr 0.9fr', gap: '8px', padding: '8px 16px', fontSize: '11px', fontWeight: '500', color: '#6b7280', borderBottom: '0.5px solid #f3f4f6' }}>
                    <span>Nama guru</span><span>Jenis</span><span>Tanggal</span><span>Hari</span><span>Status</span>
                  </div>
                  {riwayat.slice(0, 5).map((p, i) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 0.5fr 0.9fr', gap: '8px', padding: '10px 16px', borderBottom: i < Math.min(riwayat.length, 5) - 1 ? '0.5px solid #f9fafb' : 'none', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{p.guru?.nama}</span>
                      <span style={{ color: '#6b7280' }}>{p.jenisCuti.charAt(0) + p.jenisCuti.slice(1).toLowerCase()}</span>
                      <span style={{ color: '#6b7280' }}>{formatTgl(p.tanggalMulai)}</span>
                      <span style={{ color: '#374151' }}>{p.jumlahHari}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', textAlign: 'center',
                        background: p.status === 'APPROVED' ? '#dcfce7' : '#fef2f2',
                        color: p.status === 'APPROVED' ? '#16a34a' : '#dc2626',
                      }}>
                        {p.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Notifikasi */}
          <div>
            <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Notifikasi masuk</span>
              </div>
              {notifikasi.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Belum ada notifikasi</div>
              ) : (
                notifikasi.slice(0, 5).map((n, i) => (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(notifikasi.length, 5) - 1 ? '0.5px solid #f9fafb' : 'none' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{n.judul}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', lineHeight: '1.4' }}>{n.pesan}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
