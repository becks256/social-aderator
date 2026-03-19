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

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeAsset(campaignId, file.name, buffer)

  return Response.json({ ok: true, filename: file.name })
}
