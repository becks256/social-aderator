export type AspectRatio = '1:1' | '9:16' | '16:9'
export type Provenance = 'brief' | 'openai' | 'mock'
export type WorkflowState = 'generated' | 'in_review' | 'approved' | 'flagged'

export interface MarketCopy {
  headline: string
  body: string
  cta: string
  disclaimer?: string
}

export interface Product {
  id: string
  name: string
  tagline: string
  hero?: string      // filename in storage/assets/{campaignId}/; absent = generate
  packshot?: string
  logo?: string
}

export interface CampaignBrief {
  campaign: {
    id: string
    name: string
    brand: string
    markets: string[]
  }
  products: Product[]
  copy: Record<string, MarketCopy | null>  // null = localize via OpenAI
  constraints: {
    maxHeadlineChars: number
    requireDisclaimer: boolean
    safeZonePercent: number
  }
}

export interface ComplianceCheck {
  rule: string
  passed: boolean
  detail?: string
}

export interface Comment {
  author: string
  text: string
  createdAt: string
}

export interface ArtifactManifest {
  id: string
  campaignId: string
  productId: string
  market: string
  aspectRatio: AspectRatio
  outputPath: string

  localizedCopy: MarketCopy
  copyProvenance: Provenance
  assetProvenance: {
    hero: Provenance
    packshot: 'brief'
    logo: 'brief'
  }

  compliance: {
    passed: boolean
    checks: ComplianceCheck[]
  }

  state: WorkflowState
  review: {
    hearts: number
    comments: Comment[]
    approvedBy?: string
    flaggedReason?: string
  }

  createdAt: string
}

export type ReviewAction =
  | { action: 'heart' }
  | { action: 'approve'; approvedBy: string }
  | { action: 'flag'; reason: string }
  | { action: 'comment'; author: string; text: string }

// SSE event shapes
export type PipelineEvent =
  | { type: 'step'; step: string; status: 'running' | 'done' | 'error'; detail?: string }
  | { type: 'artifact'; artifactId: string; productId: string; market: string; aspectRatio: AspectRatio }
  | { type: 'complete'; total: number; errors: number }
