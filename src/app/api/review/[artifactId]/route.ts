// src/app/api/review/[artifactId]/route.ts
import { NextRequest } from 'next/server'
import { updateManifest } from '@/lib/storage'
import { applyReviewAction } from '@/lib/manifest'
import type { ReviewAction } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params
  const action = await request.json() as ReviewAction

  const updated = await updateManifest(artifactId, m => applyReviewAction(m, action))
  if (!updated) {
    return Response.json({ error: 'Artifact not found' }, { status: 404 })
  }

  return Response.json(updated)
}
