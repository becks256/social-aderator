import { describe, it, expect } from 'vitest'
import { createManifest, applyReviewAction } from './manifest'
import type { ArtifactManifest } from './types'

describe('createManifest', () => {
  it('builds manifest with correct id format', () => {
    const m = createManifest({
      campaignId: 'camp', productId: 'prod', market: 'en-US',
      aspectRatio: '1:1', outputPath: 'out.png',
      localizedCopy: { headline: 'h', body: 'b', cta: 'c' },
      copyProvenance: 'brief',
      assetProvenance: { hero: 'brief', packshot: 'brief', logo: 'brief' },
      complianceResult: { passed: true, checks: [] },
    })
    expect(m.id).toBe('camp-prod-en-US-1x1')
    expect(m.state).toBe('in_review')
    expect(m.review.hearts).toBe(0)
  })
})

describe('applyReviewAction', () => {
  const base: ArtifactManifest = {
    id: 'x', campaignId: 'c', productId: 'p', market: 'en-US',
    aspectRatio: '1:1', outputPath: 'o',
    localizedCopy: { headline: 'h', body: 'b', cta: 'c' },
    copyProvenance: 'brief',
    assetProvenance: { hero: 'brief', packshot: 'brief', logo: 'brief' },
    compliance: { passed: true, checks: [] },
    state: 'in_review',
    review: { hearts: 0, comments: [] },
    createdAt: new Date().toISOString(),
  }

  it('heart increments count', () => {
    const result = applyReviewAction(base, { action: 'heart' })
    expect(result.review.hearts).toBe(1)
  })

  it('approve sets state and approvedBy', () => {
    const result = applyReviewAction(base, { action: 'approve', approvedBy: 'Alice' })
    expect(result.state).toBe('approved')
    expect(result.review.approvedBy).toBe('Alice')
  })

  it('flag sets state and reason', () => {
    const result = applyReviewAction(base, { action: 'flag', reason: 'Wrong color' })
    expect(result.state).toBe('flagged')
    expect(result.review.flaggedReason).toBe('Wrong color')
  })

  it('comment appends to comments array', () => {
    const result = applyReviewAction(base, { action: 'comment', author: 'Bob', text: 'Looks good' })
    expect(result.review.comments).toHaveLength(1)
    expect(result.review.comments[0].text).toBe('Looks good')
  })
})
