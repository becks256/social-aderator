import { isMockMode } from './gemini'
import type { MarketCopy } from './types'

const MOCK_TRANSLATIONS: Record<string, Partial<MarketCopy>> = {
  'fr-FR': {
    headline: 'Votre peau. Votre été.',
    body: 'Protection SPF 50 et éclat toute la journée',
    cta: 'Acheter',
    disclaimer: 'Testé par des dermatologues',
  },
  'de-DE': {
    headline: 'Ihre Haut. Ihr Sommer.',
    body: 'LSF 50 Schutz trifft ganztägigen Glanz',
    cta: 'Kaufen',
  },
  'es-ES': {
    headline: 'Tu piel. Tu verano.',
    body: 'Protección SPF 50 con resplandor todo el día',
    cta: 'Comprar',
  },
}

/**
 * Localize copy for a market.
 * Mock mode: returns hardcoded translations or prefixed source copy.
 * Live mode: calls Gemini to translate.
 */
export async function localizeMarketCopy(
  source: MarketCopy,
  market: string,
  brand: string,
  productName: string
): Promise<MarketCopy> {
  if (isMockMode()) {
    const t = MOCK_TRANSLATIONS[market]
    return {
      headline: t?.headline ?? `[${market}] ${source.headline}`,
      body: t?.body ?? `[${market}] ${source.body}`,
      cta: t?.cta ?? source.cta,
      disclaimer: t?.disclaimer ?? source.disclaimer,
    }
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `Translate the following advertising copy for ${brand}'s product "${productName}" into ${market} locale. Preserve tone, energy, and brand voice. Reply ONLY with valid JSON matching this shape: { "headline": string, "body": string, "cta": string, "disclaimer": string | undefined }

Source copy:
${JSON.stringify(source, null, 2)}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (json) {
    try {
      return JSON.parse(json) as MarketCopy
    } catch {
      // fall through to source
    }
  }

  // Fallback: return source copy if Gemini response is unparseable
  return source
}
