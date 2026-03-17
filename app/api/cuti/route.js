// app/api/cuti/route.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runFlow } from '@/lib/workflow-engine'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const where = session.user.role === 'GURU'
    ? { guruId: session.user.id }
    : {}

  const pengajuan = await prisma.pengajuanCuti.findMany({
    where,
    include: {
      guru: { select: { nama: true, mapel: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json(pengajuan)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'GURU') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { jenisCuti, tanggalMulai, tanggalSelesai, jumlahHari, alasan, penggantiNama } = body

  if (!jenisCuti || !tanggalMulai || !tanggalSelesai || !alasan) {
    return Response.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  if (new Date(tanggalMulai) < new Date(new Date().toDateString())) {
    return Response.json({ error: 'Tanggal tidak boleh di masa lalu' }, { status: 400 })
  }

  try {
    const result = await runFlow('flow-pengajuan', {
      guruId: session.user.id,
      jenisCuti,
      tanggalMulai,
      tanggalSelesai,
      jumlahHari: parseInt(jumlahHari),
      alasan,
      penggantiNama,
    })
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
