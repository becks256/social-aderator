import { describe, it, expect } from 'vitest'
import { runStructuralChecks, runBriefChecks } from './compliance'
import type { MarketCopy } from './types'

describe('runStructuralChecks', () => {
  it('passes when all assets are present', () => {
    const checks = runStructuralChecks(true, true, true)
    expect(checks.every(c => c.passed)).toBe(true)
  })

  it('fails when hero is missing', () => {
    const checks = runStructuralChecks(false, true, true)
    const heroCheck = checks.find(c => c.rule === 'hero-present')
    expect(heroCheck?.passed).toBe(false)
  })

  it('fails when logo is missing', () => {
    const checks = runStructuralChecks(true, false, true)
    const logoCheck = checks.find(c => c.rule === 'logo-present')
    expect(logoCheck?.passed).toBe(false)
  })
})

describe('runBriefChecks', () => {
  const copy: MarketCopy = {
    headline: 'Short headline',
    body: 'Body text',
    cta: 'Buy',
    disclaimer: 'Legal text',
  }
  const constraints = { maxHeadlineChars: 40, requireDisclaimer: true, safeZonePercent: 90 }

  it('passes when copy meets constraints', () => {
    const checks = runBriefChecks(copy, constraints, false)
    expect(checks.every(c => c.passed)).toBe(true)
  })

  it('fails when headline is too long', () => {
    const longCopy = { ...copy, headline: 'A'.repeat(50) }
    const checks = runBriefChecks(longCopy, constraints, false)
    expect(checks.find(c => c.rule === 'headline-length')?.passed).toBe(false)
  })

  it('fails when disclaimer is required but missing', () => {
    const noDis = { ...copy, disclaimer: undefined }
    const checks = runBriefChecks(noDis, constraints, false)
    expect(checks.find(c => c.rule === 'disclaimer-required')?.passed).toBe(false)
  })

  it('fails when text overflows', () => {
    const checks = runBriefChecks(copy, constraints, true)
    expect(checks.find(c => c.rule === 'text-overflow')?.passed).toBe(false)
  })
})
