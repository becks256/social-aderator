import sharp from 'sharp'

export function isMockMode(): boolean {
  return !process.env.GEMINI_API_KEY
}

/**
 * Generate a hero image for a product.
 * In mock mode: returns a Sharp-drawn placeholder PNG.
 * With API key: calls Gemini 2.5 Flash image generation.
 */
export async function generateHeroImage(
  productName: string,
  tagline: string,
  brand: string
): Promise<Buffer> {
  if (isMockMode()) {
    return generatePlaceholderImage(productName, '#4a90d9', 1080, 1080)
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `Product hero image for ${brand}. Product: ${productName}. Tagline: ${tagline}. Clean studio photography, white or gradient background, professional advertising style.`

  // Note: image generation requires the preview image-generation model variant;
  // standard gemini-2.5-flash does not support image output modality.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: { responseModalities: ['image'] },
  })

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('image/')
  )
  if (!part?.inlineData?.data) {
    // fallback to placeholder if generation fails
    return generatePlaceholderImage(productName, '#4a90d9', 1080, 1080)
  }

  return Buffer.from(part.inlineData.data, 'base64')
}

/**
 * Run a Gemini compliance review on a rendered image.
 * Returns { passed, issues } — advisory only, not a hard block.
 */
export async function reviewCompliance(
  imageBase64: string,
  productName: string,
  brand: string,
  headline: string
): Promise<{ passed: boolean; issues: string[] }> {
  if (isMockMode()) {
    return { passed: true, issues: [] }
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `You are a brand compliance reviewer. Review this ad creative for brand ${brand}, product ${productName}, headline "${headline}". Check: 1) Is the copy appropriate and on-brand? 2) Is there any potentially offensive content? Reply with JSON: { "passed": boolean, "issues": string[] }`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { mimeType: 'image/png', data: imageBase64 } },
      { text: prompt },
    ],
  })

  try {
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    if (json) return JSON.parse(json)
  } catch {
    // ignore parse errors
  }
  return { passed: true, issues: [] }
}

export async function generatePlaceholderImage(
  label: string,
  color: string,
  width: number,
  height: number
): Promise<Buffer> {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${color}" opacity="0.3"/>
    <rect width="${width}" height="${height}" fill="none" stroke="${color}" stroke-width="4"/>
    <text x="${width / 2}" y="${height / 2}" font-family="sans-serif" font-size="${Math.floor(width / 20)}"
      fill="${color}" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
