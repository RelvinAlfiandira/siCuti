import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runFlow } from '@/lib/workflow-engine' 

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'KEPALA_SEKOLAH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { catatan } = await req.json()

  try {
    await runFlow('flow-approval', {
      pengajuanId: id,
      ksId: session.user.id,
      catatan,
    })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
