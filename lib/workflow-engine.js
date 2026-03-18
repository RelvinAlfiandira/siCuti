// lib/workflow-engine.js
// ─────────────────────────────────────────────────────────
// WORKFLOW ENGINE — Inti otomasi sistem cuti
// Setiap flow dipanggil oleh API route, bukan oleh user
// ─────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// ─────────────────────────────────────
// ENTRY POINT — panggil flow berdasarkan nama
// ─────────────────────────────────────
export async function runFlow(flowName, payload) {
  console.log(`[ENGINE] Mulai flow: ${flowName}`)
  const startTime = Date.now()

  try {
    switch (flowName) {
      case 'flow-pengajuan':
        return await flowPengajuan(payload)
      case 'flow-approval':
        return await flowApproval(payload)
      case 'flow-penolakan':
        return await flowPenolakan(payload)
      case 'flow-eksekusi':
        return await flowEksekusi(payload)
      case 'flow-reminder':
        return await flowReminder(payload)
      default:
        throw new Error(`Flow tidak dikenal: ${flowName}`)
    }
  } catch (error) {
    console.error(`[ENGINE] Flow ${flowName} gagal:`, error.message)
    await saveLog(payload.pengajuanId, flowName, 'error', 'FAILED', error.message, Date.now() - startTime)
    throw error
  }
}

// ─────────────────────────────────────
// FLOW 1 — Pengajuan cuti oleh guru
// Dipanggil dari: POST /api/cuti
// ─────────────────────────────────────
async function flowPengajuan(payload) {
  const { guruId, jenisCuti, tanggalMulai, tanggalSelesai, jumlahHari, alasan, penggantiNama } = payload

  // Step 1: Validasi kuota
  await logStep(null, 'flow-pengajuan', 'validasi-kuota', async () => {
    const kuota = await prisma.kuotaCuti.findUnique({ where: { userId: guruId } })
    if (!kuota) throw new Error('Data kuota guru tidak ditemukan')
    if (kuota.terpakai + kuota.pending + jumlahHari > kuota.totalKuota) {
      throw new Error(`Kuota tidak cukup. Sisa: ${kuota.totalKuota - kuota.terpakai - kuota.pending} hari`)
    }
  })

  // Step 2: Simpan pengajuan ke database
  let pengajuan
  await logStep(null, 'flow-pengajuan', 'simpan-pengajuan', async () => {
    pengajuan = await prisma.pengajuanCuti.create({
      data: {
        guruId,
        jenisCuti,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        jumlahHari,
        alasan,
        penggantiNama,
        status: 'PENDING'
      }
    })
  })

  // Step 3: Update kuota pending
  await logStep(pengajuan.id, 'flow-pengajuan', 'update-kuota-pending', async () => {
    await prisma.kuotaCuti.update({
      where: { userId: guruId },
      data: { pending: { increment: jumlahHari } }
    })
  })

  // Step 4: Simpan notifikasi untuk KS
  await logStep(pengajuan.id, 'flow-pengajuan', 'notifikasi-ks', async () => {
    const ks = await prisma.user.findFirst({ where: { role: 'KEPALA_SEKOLAH' } })
    const guru = await prisma.user.findUnique({ where: { id: guruId } })
    if (ks) {
      await prisma.notifikasi.create({
        data: {
          userId: ks.id,
          pengajuanId: pengajuan.id,
          judul: 'Pengajuan cuti baru',
          pesan: `${guru.nama} mengajukan cuti ${jenisCuti.toLowerCase()} selama ${jumlahHari} hari`
        }
      })

      // Step 5: Kirim email ke KS
      await kirimEmail({
        to: ks.email,
        subject: `[SiCuti] Pengajuan cuti baru — ${guru.nama}`,
        html: templateEmailKs(guru, pengajuan)
      })
    }
  })

  return { success: true, pengajuanId: pengajuan.id }
}

// ─────────────────────────────────────
// FLOW 2 — Persetujuan oleh KS
// Dipanggil dari: POST /api/cuti/[id]/approve
// ─────────────────────────────────────
async function flowApproval(payload) {
  const { pengajuanId, ksId, catatan } = payload

  // Step 1: Ambil data pengajuan
  let pengajuan
  await logStep(pengajuanId, 'flow-approval', 'ambil-pengajuan', async () => {
    pengajuan = await prisma.pengajuanCuti.findUnique({
      where: { id: pengajuanId },
      include: { guru: true }
    })
    if (!pengajuan) throw new Error('Pengajuan tidak ditemukan')
    if (pengajuan.status !== 'PENDING') throw new Error('Pengajuan sudah diproses')
  })

  // Step 2: Update status ke APPROVED
  await logStep(pengajuanId, 'flow-approval', 'update-status', async () => {
    await prisma.pengajuanCuti.update({
      where: { id: pengajuanId },
      data: {
        status: 'APPROVED',
        approvedById: ksId,
        approvedAt: new Date(),
        catatanKs: catatan
      }
    })
  })

  // Step 3: Jalankan flow eksekusi otomatis
  await flowEksekusi({ pengajuanId, pengajuan })

  return { success: true }
}

// ─────────────────────────────────────
// FLOW 3 — Eksekusi otomatis pasca approval
// Dipanggil otomatis oleh flow-approval
// ─────────────────────────────────────
async function flowEksekusi(payload) {
  const { pengajuanId } = payload

  let pengajuan = payload.pengajuan
  if (!pengajuan) {
    pengajuan = await prisma.pengajuanCuti.findUnique({
      where: { id: pengajuanId },
      include: { guru: true }
    })
  }

  // Step 1: Kurangi kuota cuti (pindah dari pending ke terpakai)
  await logStep(pengajuanId, 'flow-eksekusi', 'update-kuota', async () => {
    await prisma.kuotaCuti.update({
      where: { userId: pengajuan.guruId },
      data: {
        terpakai: { increment: pengajuan.jumlahHari },
        pending: { decrement: pengajuan.jumlahHari }
      }
    })
  })

  // Step 2: Update jadwal mengajar — flag CUTI
  await logStep(pengajuanId, 'flow-eksekusi', 'update-jadwal', async () => {
    await prisma.jadwalMengajar.updateMany({
      where: {
        guruId: pengajuan.guruId,
        tanggal: {
          gte: pengajuan.tanggalMulai,
          lte: pengajuan.tanggalSelesai
        }
      },
      data: { status: 'CUTI' }
    })
  })

  // Step 3: Generate surat keterangan PDF
  let suratUrl
  await logStep(pengajuanId, 'flow-eksekusi', 'generate-surat', async () => {
    suratUrl = await generateSuratPDF(pengajuan)
    await prisma.pengajuanCuti.update({
      where: { id: pengajuanId },
      data: { suratUrl }
    })
  })

  // Step 4: Kirim email + surat ke guru
  await logStep(pengajuanId, 'flow-eksekusi', 'kirim-email-guru', async () => {
    await kirimEmail({
      to: pengajuan.guru.email,
      subject: '[SiCuti] Cuti Anda telah disetujui',
      html: templateEmailGuru(pengajuan),
      attachments: suratUrl ? [{ filename: `surat_cuti_${pengajuanId}.pdf`, path: path.join(process.cwd(), 'public', suratUrl) }] : []
    })
  })

  // Step 5: Simpan notifikasi untuk guru
  await logStep(pengajuanId, 'flow-eksekusi', 'notifikasi-guru', async () => {
    await prisma.notifikasi.create({
      data: {
        userId: pengajuan.guruId,
        pengajuanId,
        judul: 'Cuti disetujui',
        pesan: `Cuti ${pengajuan.jenisCuti.toLowerCase()} Anda ${formatTanggal(pengajuan.tanggalMulai)}–${formatTanggal(pengajuan.tanggalSelesai)} telah disetujui. Surat keterangan sudah dikirim ke email Anda.`
      }
    })
  })

  return { success: true, suratUrl }
}

// ─────────────────────────────────────
// FLOW 4 — Penolakan oleh KS
// Dipanggil dari: POST /api/cuti/[id]/reject
// ─────────────────────────────────────
async function flowPenolakan(payload) {
  const { pengajuanId, ksId, catatan } = payload

  let pengajuan
  await logStep(pengajuanId, 'flow-penolakan', 'update-status', async () => {
    pengajuan = await prisma.pengajuanCuti.update({
      where: { id: pengajuanId },
      data: {
        status: 'REJECTED',
        approvedById: ksId,
        approvedAt: new Date(),
        catatanKs: catatan
      },
      include: { guru: true }
    })
  })

  // Kembalikan kuota pending
  await logStep(pengajuanId, 'flow-penolakan', 'kembalikan-kuota', async () => {
    await prisma.kuotaCuti.update({
      where: { userId: pengajuan.guruId },
      data: { pending: { decrement: pengajuan.jumlahHari } }
    })
  })

  // Kirim notifikasi + email ke guru
  await logStep(pengajuanId, 'flow-penolakan', 'notifikasi-guru', async () => {
    await prisma.notifikasi.create({
      data: {
        userId: pengajuan.guruId,
        pengajuanId,
        judul: 'Pengajuan cuti ditolak',
        pesan: `Pengajuan cuti Anda ditolak. Alasan: ${catatan || 'Tidak ada catatan'}`
      }
    })

    await kirimEmail({
      to: pengajuan.guru.email,
      subject: '[SiCuti] Pengajuan cuti Anda ditolak',
      html: templateEmailTolak(pengajuan, catatan)
    })
  })

  return { success: true }
}

// ─────────────────────────────────────
// FLOW 5 — Reminder kuota hampir habis
// Dipanggil oleh Scheduler (cron) tiap tgl 1
// ─────────────────────────────────────
export async function flowReminder() {
  console.log('[SCHEDULER] Menjalankan flow-reminder...')

  // Ambil semua guru dengan sisa kuota < 3
  const guruKuotaRendah = await prisma.kuotaCuti.findMany({
    where: {
      terpakai: { gte: prisma.kuotaCuti.fields.totalKuota - 3 }
    },
    include: { user: true }
  })

  for (const kuota of guruKuotaRendah) {
    const sisaKuota = kuota.totalKuota - kuota.terpakai - kuota.pending
    if (sisaKuota <= 3) {
      await logStep(null, 'flow-reminder', `reminder-${kuota.userId}`, async () => {
        await kirimEmail({
          to: kuota.user.email,
          subject: '[SiCuti] Reminder: Sisa kuota cuti Anda menipis',
          html: templateEmailReminder(kuota.user, sisaKuota)
        })
      })
    }
  }

  return { success: true }
}

// ─────────────────────────────────────
// HELPER: Generate PDF dengan Puppeteer
// ─────────────────────────────────────
async function generateSuratPDF(pengajuan) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 24px; }
        .header h2 { font-size: 16px; margin: 4px 0; }
        .header h3 { font-size: 14px; margin: 2px 0; font-weight: normal; }
        .title { text-align: center; font-size: 15px; font-weight: bold; margin: 20px 0; text-decoration: underline; }
        .nomor { text-align: center; font-size: 13px; margin-bottom: 20px; }
        .isi { font-size: 13px; line-height: 1.8; }
        table.data { margin: 12px 0 12px 20px; font-size: 13px; }
        table.data td { padding: 2px 8px 2px 0; }
        .ttd { margin-top: 40px; float: right; text-align: center; }
        .ttd .garis { margin-top: 60px; border-top: 1px solid #000; padding-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>PEMERINTAH KOTA ...</h2>
        <h2>DINAS PENDIDIKAN</h2>
        <h3>SMA NEGERI 1 ...</h3>
        <h3>Alamat: Jl. ... | Telp: ...</h3>
      </div>
      <div class="title">SURAT KETERANGAN CUTI</div>
      <div class="nomor">Nomor: ${pengajuan.id.slice(0, 8).toUpperCase()}/CUTI/${new Date().getFullYear()}</div>
      <div class="isi">
        <p>Yang bertanda tangan di bawah ini, Kepala SMA Negeri 1 ..., dengan ini menerangkan bahwa:</p>
        <table class="data">
          <tr><td>Nama</td><td>:</td><td><strong>${pengajuan.guru.nama}</strong></td></tr>
          <tr><td>NIP</td><td>:</td><td>${pengajuan.guru.nip || '-'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td>Guru ${pengajuan.guru.mapel || ''}</td></tr>
          <tr><td>Jenis Cuti</td><td>:</td><td>${pengajuan.jenisCuti}</td></tr>
          <tr><td>Lama Cuti</td><td>:</td><td>${pengajuan.jumlahHari} hari kerja</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>${formatTanggal(pengajuan.tanggalMulai)} s/d ${formatTanggal(pengajuan.tanggalSelesai)}</td></tr>
          <tr><td>Alasan</td><td>:</td><td>${pengajuan.alasan}</td></tr>
        </table>
        <p>Demikian surat keterangan ini dibuat untuk dapat digunakan sebagaimana mestinya.</p>
      </div>
      <div class="ttd">
        <p>${formatTanggalPanjang(new Date())}</p>
        <p>Kepala Sekolah,</p>
        <div class="garis">
          <p><strong>Relvin Alfiandira</strong></p>
          <p>NIP. ...</p>
        </div>
      </div>
    </body>
    </html>
  `

  const outputDir = path.join(process.cwd(), 'public', 'surat')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const filename = `surat_cuti_${pengajuan.id}.pdf`
  const outputPath = path.join(outputDir, filename)

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.pdf({ path: outputPath, format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '25mm', right: '20mm' } })
  await browser.close()

  return `/surat/${filename}`
}

// ─────────────────────────────────────
// HELPER: Kirim email via Nodemailer
// ─────────────────────────────────────
async function kirimEmail({ to, subject, html, attachments = [] }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'SiCuti <noreply@sekolah.sch.id>',
    to,
    subject,
    html,
    attachments
  })
}

// ─────────────────────────────────────
// HELPER: Simpan log eksekusi ke DB
// ─────────────────────────────────────
async function logStep(pengajuanId, namaFlow, namaStep, fn) {
  const start = Date.now()
  try {
    await fn()
    const durasi = Date.now() - start
    await saveLog(pengajuanId, namaFlow, namaStep, 'SUCCESS', null, durasi)
    console.log(`[${namaFlow}] ✓ ${namaStep} (${durasi}ms)`)
  } catch (error) {
    const durasi = Date.now() - start
    await saveLog(pengajuanId, namaFlow, namaStep, 'FAILED', error.message, durasi)
    console.error(`[${namaFlow}] ✗ ${namaStep}: ${error.message}`)
    throw error
  }
}

async function saveLog(pengajuanId, namaFlow, namaStep, status, pesan, durasi) {
  try {
    await prisma.logEksekusi.create({
      data: { pengajuanId, namaFlow, namaStep, status, pesan, durasi }
    })
  } catch (e) {
    console.error('[LOG] Gagal simpan log:', e.message)
  }
}

// ─────────────────────────────────────
// HELPER: Format tanggal
// ─────────────────────────────────────
function formatTanggal(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTanggalPanjang(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─────────────────────────────────────
// TEMPLATE EMAIL
// ─────────────────────────────────────
function templateEmailKs(guru, pengajuan) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h3>Pengajuan Cuti Baru</h3>
      <p><strong>${guru.nama}</strong> mengajukan cuti:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Jenis</td><td>${pengajuan.jenisCuti}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Tanggal</td><td>${formatTanggal(pengajuan.tanggalMulai)} – ${formatTanggal(pengajuan.tanggalSelesai)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Durasi</td><td>${pengajuan.jumlahHari} hari</td></tr>
        <tr><td style="padding:6px 0;color:#666">Alasan</td><td>${pengajuan.alasan}</td></tr>
      </table>
      <p>Silakan login ke SiCuti untuk menyetujui atau menolak pengajuan ini.</p>
    </div>
  `
}

function templateEmailGuru(pengajuan) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h3 style="color:#16a34a">Cuti Anda Disetujui</h3>
      <p>Pengajuan cuti <strong>${pengajuan.jenisCuti.toLowerCase()}</strong> Anda telah disetujui.</p>
      <p>Periode: <strong>${formatTanggal(pengajuan.tanggalMulai)} – ${formatTanggal(pengajuan.tanggalSelesai)}</strong></p>
      <p>Surat keterangan cuti terlampir pada email ini.</p>
      ${pengajuan.catatanKs ? `<p>Catatan KS: ${pengajuan.catatanKs}</p>` : ''}
    </div>
  `
}

function templateEmailTolak(pengajuan, catatan) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h3 style="color:#dc2626">Pengajuan Cuti Ditolak</h3>
      <p>Pengajuan cuti <strong>${pengajuan.jenisCuti.toLowerCase()}</strong> Anda tidak dapat disetujui.</p>
      <p>Alasan: <strong>${catatan || 'Tidak ada catatan'}</strong></p>
      <p>Silakan hubungi Kepala Sekolah untuk informasi lebih lanjut.</p>
    </div>
  `
}

function templateEmailReminder(user, sisaKuota) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h3 style="color:#d97706">Reminder: Sisa Kuota Cuti</h3>
      <p>Yth. <strong>${user.nama}</strong>,</p>
      <p>Sisa kuota cuti Anda tinggal <strong>${sisaKuota} hari</strong> untuk tahun ini.</p>
      <p>Gunakan dengan bijak sebelum akhir tahun.</p>
    </div>
  `
}
