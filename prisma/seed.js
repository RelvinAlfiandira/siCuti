// prisma/seed.js
// Jalankan dengan: node prisma/seed.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Mulai seeding...')

  // Hapus data lama (urutan penting karena ada relasi)
  await prisma.logEksekusi.deleteMany()
  await prisma.notifikasi.deleteMany()
  await prisma.pengajuanCuti.deleteMany()
  await prisma.jadwalMengajar.deleteMany()
  await prisma.kuotaCuti.deleteMany()
  await prisma.user.deleteMany()

  const hash = (pwd) => bcrypt.hashSync(pwd, 10)

  // ─── Buat Kepala Sekolah ───
  const ks = await prisma.user.create({
    data: {
      nama: 'Drs. Ahmad Fauzi, M.Pd.',
      email: 'ks@sekolah.sch.id',
      password: hash('password123'),
      nip: '196501011990011001',
      role: 'KEPALA_SEKOLAH',
    }
  })

  // ─── Buat Guru ───
  const guru1 = await prisma.user.create({
    data: {
      nama: 'Budi Santoso',
      email: 'budi@sekolah.sch.id',
      password: hash('password123'),
      nip: '198003012005011002',
      role: 'GURU',
      mapel: 'Matematika',
    }
  })

  const guru2 = await prisma.user.create({
    data: {
      nama: 'Sri Wahyuni',
      email: 'sri@sekolah.sch.id',
      password: hash('password123'),
      nip: '198505152008012003',
      role: 'GURU',
      mapel: 'Bahasa Indonesia',
    }
  })

  const guru3 = await prisma.user.create({
    data: {
      nama: 'Eko Prasetyo',
      email: 'eko@sekolah.sch.id',
      password: hash('password123'),
      nip: '199001202015011004',
      role: 'GURU',
      mapel: 'IPA',
    }
  })

  // ─── Buat Kuota Cuti ───
  await prisma.kuotaCuti.createMany({
    data: [
      { userId: guru1.id, tahun: 2026, totalKuota: 12, terpakai: 2, pending: 0 },
      { userId: guru2.id, tahun: 2026, totalKuota: 12, terpakai: 0, pending: 0 },
      { userId: guru3.id, tahun: 2026, totalKuota: 12, terpakai: 0, pending: 0 },
    ]
  })

  // ─── Buat Riwayat Pengajuan ───
  await prisma.pengajuanCuti.createMany({
    data: [
      {
        guruId: guru1.id,
        jenisCuti: 'TAHUNAN',
        tanggalMulai: new Date('2026-01-05'),
        tanggalSelesai: new Date('2026-01-06'),
        jumlahHari: 2,
        alasan: 'Keperluan keluarga',
        status: 'APPROVED',
        approvedById: ks.id,
        approvedAt: new Date('2026-01-04'),
        suratUrl: null,
      },
      {
        guruId: guru1.id,
        jenisCuti: 'SAKIT',
        tanggalMulai: new Date('2026-02-14'),
        tanggalSelesai: new Date('2026-02-14'),
        jumlahHari: 1,
        alasan: 'Sakit demam',
        status: 'APPROVED',
        approvedById: ks.id,
        approvedAt: new Date('2026-02-14'),
        suratUrl: null,
      },
    ]
  })

  console.log('─────────────────────────────')
  console.log('Seeding selesai! Akun tersedia:')
  console.log('')
  console.log('KEPALA SEKOLAH')
  console.log('  Email    : ks@sekolah.sch.id')
  console.log('  Password : password123')
  console.log('')
  console.log('GURU 1')
  console.log('  Email    : budi@sekolah.sch.id')
  console.log('  Password : password123')
  console.log('')
  console.log('GURU 2')
  console.log('  Email    : sri@sekolah.sch.id')
  console.log('  Password : password123')
  console.log('')
  console.log('GURU 3')
  console.log('  Email    : eko@sekolah.sch.id')
  console.log('  Password : password123')
  console.log('─────────────────────────────')
}

main()
  .catch((e) => {
    console.error('Seeding gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
