'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const JENIS_CUTI = [
  { value: 'TAHUNAN', label: 'Cuti tahunan' },
  { value: 'SAKIT', label: 'Cuti sakit' },
  { value: 'MELAHIRKAN', label: 'Cuti melahirkan' },
  { value: 'KELUARGA', label: 'Cuti keperluan keluarga' },
  { value: 'BESAR', label: 'Cuti besar' },
]

function hitungHariKerja(mulai, selesai) {
  if (!mulai || !selesai) return 0
  let count = 0
  const start = new Date(mulai)
  const end = new Date(selesai)
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function AjukanCutiPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    jenisCuti: 'TAHUNAN',
    tanggalMulai: '',
    tanggalSelesai: '',
    alasan: '',
    penggantiNama: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const jumlahHari = hitungHariKerja(form.tanggalMulai, form.tanggalSelesai)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.tanggalMulai || !form.tanggalSelesai) {
      setError('Tanggal mulai dan selesai wajib diisi')
      return
    }
    if (new Date(form.tanggalSelesai) < new Date(form.tanggalMulai)) {
      setError('Tanggal selesai tidak boleh sebelum tanggal mulai')
      return
    }
    if (jumlahHari === 0) {
      setError('Tanggal yang dipilih tidak mengandung hari kerja')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cuti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jumlahHari }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengajukan cuti')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/guru/dashboard'), 2000)
    } catch (err) {
      setError('Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

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
              if (item === 'Riwayat') router.push('/guru/riwayat')
            }} style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: item === 'Ajukan Cuti' ? '#f3f4f6' : 'transparent',
              fontSize: '13px', fontWeight: item === 'Ajukan Cuti' ? '500' : '400',
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
        </div>
      </nav>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
            Pengajuan cuti baru
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            Isi form di bawah dan sistem akan otomatis mengirim notifikasi ke Kepala Sekolah
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: '12px',
            padding: '16px', marginBottom: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>Pengajuan berhasil dikirim!</div>
            <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>
              Notifikasi sudah dikirim ke Kepala Sekolah. Mengalihkan ke dashboard...
            </div>
          </div>
        )}

        {!success && (
          <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e5e7eb' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Detail pengajuan</span>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>

              {/* Jenis Cuti */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Jenis cuti <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  name="jenisCuti"
                  value={form.jenisCuti}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '0.5px solid #d1d5db', borderRadius: '8px',
                    fontSize: '13px', background: '#fff', color: '#111827',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                >
                  {JENIS_CUTI.map(j => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Tanggal mulai <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggalMulai"
                    value={form.tanggalMulai}
                    min={today}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: '0.5px solid #d1d5db', borderRadius: '8px',
                      fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                      background: '#fff', color: '#111827',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Tanggal selesai <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggalSelesai"
                    value={form.tanggalSelesai}
                    min={form.tanggalMulai || today}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: '0.5px solid #d1d5db', borderRadius: '8px',
                      fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                      background: '#fff', color: '#111827',
                    }}
                  />
                </div>
              </div>

              {/* Info durasi otomatis */}
              {jumlahHari > 0 && (
                <div style={{
                  background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: '8px',
                  padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#1d4ed8',
                }}>
                  Durasi: <strong>{jumlahHari} hari kerja</strong> (tidak termasuk Sabtu & Minggu)
                </div>
              )}

              {/* Alasan */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Alasan pengajuan <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  name="alasan"
                  value={form.alasan}
                  onChange={handleChange}
                  placeholder="Jelaskan alasan pengajuan cuti Anda..."
                  required
                  rows={3}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '0.5px solid #d1d5db', borderRadius: '8px',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    background: '#fff', color: '#111827', resize: 'vertical',
                  }}
                />
              </div>

              {/* Pengganti */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Nama guru pengganti <span style={{ color: '#9ca3af' }}>(opsional)</span>
                </label>
                <input
                  type="text"
                  name="penggantiNama"
                  value={form.penggantiNama}
                  onChange={handleChange}
                  placeholder="Nama guru yang menggantikan"
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '0.5px solid #d1d5db', borderRadius: '8px',
                    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    background: '#fff', color: '#111827',
                  }}
                />
              </div>

              {/* Info otomasi */}
              <div style={{
                background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: '8px',
                padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#6b7280', lineHeight: '1.6',
              }}>
                Setelah diajukan, sistem akan otomatis mengirim notifikasi ke Kepala Sekolah.
                Jika disetujui, surat keterangan cuti akan digenerate otomatis dan dikirim ke email Anda.
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px',
                  padding: '10px 12px', fontSize: '12px', color: '#dc2626', marginBottom: '14px',
                }}>
                  {error}
                </div>
              )}

              {/* Tombol */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => router.push('/guru/dashboard')}
                  style={{
                    flex: 1, padding: '10px', background: 'transparent',
                    border: '0.5px solid #d1d5db', borderRadius: '8px',
                    fontSize: '13px', color: '#374151', cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || jumlahHari === 0}
                  style={{
                    flex: 2, padding: '10px',
                    background: loading || jumlahHari === 0 ? '#9ca3af' : '#111827',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '500',
                    cursor: loading || jumlahHari === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Memproses...' : 'Ajukan cuti'}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}
