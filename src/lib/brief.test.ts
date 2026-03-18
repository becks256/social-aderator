import { describe, it, expect } from 'vitest'
import { parseBrief, validateBrief } from './brief'

const VALID_YAML = `
campaign:
  id: test-campaign
  name: Test Campaign
  brand: Acme
  markets: [en-US, fr-FR]
products:
  - id: prod-a
    name: Product A
    tagline: "Great product"
    hero: hero.jpg
    packshot: pack.png
    logo: logo.png
copy:
  en-US:
    headline: "Buy now"
    body: "It is great"
    cta: "Shop"
constraints:
  maxHeadlineChars: 40
  requireDisclaimer: false
  safeZonePercent: 90
`

const VALID_JSON = JSON.stringify({
  campaign: { id: 'c', name: 'C', brand: 'B', markets: ['en-US'] },
  products: [{ id: 'p', name: 'P', tagline: 't', packshot: 'p.png', logo: 'l.png' }],
  copy: { 'en-US': null },
  constraints: { maxHeadlineChars: 40, requireDisclaimer: false, safeZonePercent: 90 },
})

describe('parseBrief', () => {
  it('parses valid YAML', () => {
    const brief = parseBrief(VALID_YAML)
    expect(brief.campaign.id).toBe('test-campaign')
    expect(brief.products).toHaveLength(1)
    expect(brief.products[0].hero).toBe('hero.jpg')
  })

  it('parses valid JSON', () => {
    const brief = parseBrief(VALID_JSON)
    expect(brief.campaign.id).toBe('c')
  })

  it('throws on invalid YAML', () => {
    expect(() => parseBrief('key: :\n  bad: [unterminated')).toThrow()
  })
})

describe('validateBrief', () => {
  it('accepts a valid brief', () => {
    const brief = parseBrief(VALID_YAML)
    expect(() => validateBrief(brief)).not.toThrow()
  })

  it('throws when campaign.id is missing', () => {
    const brief = parseBrief(VALID_YAML)
    // @ts-expect-error intentional
    brief.campaign.id = ''
    expect(() => validateBrief(brief)).toThrow(/campaign.id/)
  })

  it('throws when no products', () => {
    const brief = parseBrief(VALID_YAML)
    brief.products = []
    expect(() => validateBrief(brief)).toThrow(/products/)
  })

  it('throws when no markets', () => {
    const brief = parseBrief(VALID_YAML)
    brief.campaign.markets = []
    expect(() => validateBrief(brief)).toThrow(/markets/)
  })
})
