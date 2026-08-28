import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const notifikasi = await prisma.notifikasi.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return Response.json(notifikasi)
}
