import type { ComplianceCheck, MarketCopy } from './types'
import type { CampaignBrief } from './types'

export function runStructuralChecks(
  heroPresent: boolean,
  logoPresent: boolean,
  packshotPresent: boolean
): ComplianceCheck[] {
  return [
    { rule: 'hero-present', passed: heroPresent, detail: heroPresent ? undefined : 'Hero image is missing' },
    { rule: 'logo-present', passed: logoPresent, detail: logoPresent ? undefined : 'Logo is missing' },
    { rule: 'packshot-present', passed: packshotPresent, detail: packshotPresent ? undefined : 'Packshot is missing' },
  ]
}

export function runBriefChecks(
  copy: MarketCopy,
  constraints: CampaignBrief['constraints'],
  textOverflows: boolean
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = []

  const headlineOk = copy.headline.length <= constraints.maxHeadlineChars
  checks.push({
    rule: 'headline-length',
    passed: headlineOk,
    detail: headlineOk
      ? undefined
      : `Headline is ${copy.headline.length} chars (max ${constraints.maxHeadlineChars})`,
  })

  if (constraints.requireDisclaimer) {
    const hasDisclaimer = !!copy.disclaimer?.trim()
    checks.push({
      rule: 'disclaimer-required',
      passed: hasDisclaimer,
      detail: hasDisclaimer ? undefined : 'Disclaimer is required but missing',
    })
  }

  checks.push({
    rule: 'text-overflow',
    passed: !textOverflows,
    detail: textOverflows ? 'Text overflows the safe zone' : undefined,
  })

  return checks
}

export function aggregateChecks(
  structural: ComplianceCheck[],
  brief: ComplianceCheck[],
  gemini?: { passed: boolean; issues: string[] }
): { passed: boolean; checks: ComplianceCheck[] } {
  const all: ComplianceCheck[] = [...structural, ...brief]

  if (gemini) {
    all.push({
      rule: 'gemini-brand-review',
      passed: gemini.passed,
      detail: gemini.issues.join('; ') || undefined,
    })
  }

  return { passed: all.every(c => c.passed), checks: all }
}
