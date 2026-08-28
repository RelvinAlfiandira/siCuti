import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const kuota = await prisma.kuotaCuti.findUnique({
    where: { userId: session.user.id }
  })

  return Response.json(kuota)
}
