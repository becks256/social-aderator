import type { ArtifactManifest, AspectRatio, MarketCopy, Provenance, ReviewAction, ComplianceCheck } from './types'

function ratioToSlug(ratio: AspectRatio): string {
  return ratio.replace(':', 'x')
}

export function createManifest(input: {
  campaignId: string
  productId: string
  market: string
  aspectRatio: AspectRatio
  outputPath: string
  localizedCopy: MarketCopy
  copyProvenance: Provenance
  assetProvenance: { hero: Provenance; packshot: 'brief'; logo: 'brief' }
  complianceResult: { passed: boolean; checks: ComplianceCheck[] }
}): ArtifactManifest {
  const id = `${input.campaignId}-${input.productId}-${input.market}-${ratioToSlug(input.aspectRatio)}`
  return {
    id,
    campaignId: input.campaignId,
    productId: input.productId,
    market: input.market,
    aspectRatio: input.aspectRatio,
    outputPath: input.outputPath,
    localizedCopy: input.localizedCopy,
    copyProvenance: input.copyProvenance,
    assetProvenance: input.assetProvenance,
    compliance: input.complianceResult,
    state: 'in_review',
    review: { hearts: 0, comments: [] },
    createdAt: new Date().toISOString(),
  }
}

export function applyReviewAction(
  manifest: ArtifactManifest,
  action: ReviewAction
): ArtifactManifest {
  const m = structuredClone(manifest)

  switch (action.action) {
    case 'heart':
      m.review.hearts += 1
      break
    case 'approve':
      m.state = 'approved'
      m.review.approvedBy = action.approvedBy
      break
    case 'flag':
      m.state = 'flagged'
      m.review.flaggedReason = action.reason
      break
    case 'comment':
      m.review.comments.push({
        author: action.author,
        text: action.text,
        createdAt: new Date().toISOString(),
      })
      break
  }

  return m
}
