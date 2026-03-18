// app/api/log/route.js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const logs = await prisma.logEksekusi.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return Response.json(logs)
}
