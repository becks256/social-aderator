// src/app/api/assets/upload/route.ts
import { NextRequest } from 'next/server'
import { writeAsset } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const campaignId = formData.get('campaignId')
  const file = formData.get('file')

  if (!campaignId || typeof campaignId !== 'string') {
    return Response.json({ error: 'campaignId is required' }, { status: 400 })
  }
  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'file is required' }, { status: 400 })
  }

  const filename = formData.get('filename')
  const targetName = typeof filename === 'string' && filename.trim() ? filename.trim() : file.name

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeAsset(campaignId, targetName, buffer)

  return Response.json({ ok: true, filename: targetName })
}
