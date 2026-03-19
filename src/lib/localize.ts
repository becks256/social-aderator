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

  const prompt = `Translate the following advertising copy for ${brand}'s product "${productName}" into the ${market} locale. Preserve tone, energy, and brand voice.

Source copy:
${JSON.stringify(source, null, 2)}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          headline:   { type: 'string' },
          body:       { type: 'string' },
          cta:        { type: 'string' },
          disclaimer: { type: 'string' },
        },
        required: ['headline', 'body', 'cta'],
      },
    },
  })

  try {
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return JSON.parse(text) as MarketCopy
  } catch {
    // Fallback: return source copy if response is unparseable
    return source
  }
}
