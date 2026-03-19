// src/app/api/pipeline/parse-brief/route.ts
import { NextRequest } from 'next/server'
import { parseBrief, validateBrief } from '@/lib/brief'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  try {
    const brief = parseBrief(body)
    validateBrief(brief)
    return Response.json({ brief })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
