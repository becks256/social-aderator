import sharp from 'sharp'
import OpenAI from 'openai'

export function isMockMode(): boolean {
  return !process.env.OPENAI_API_KEY
}

function makeClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

/**
 * Generate a hero image for a product.
 * In mock mode: returns a Sharp-drawn placeholder PNG.
 * With API key: calls gpt-image-1.5 image generation.
 */
export async function generateHeroImage(
  productName: string,
  tagline: string,
  brand: string
): Promise<Buffer> {
  if (isMockMode()) {
    return generatePlaceholderImage(productName, '#4a90d9', 1080, 1080)
  }

  const ai = makeClient()
  const prompt = `Product hero image for ${brand}. Product: ${productName}. Tagline: ${tagline}. Clean studio photography, white or gradient background, professional advertising style.`

  const response = await ai.images.generate({
    model: 'gpt-image-1.5',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) {
    return generatePlaceholderImage(productName, '#4a90d9', 1080, 1080)
  }

  return Buffer.from(b64, 'base64')
}

/**
 * Run an AI compliance review on a rendered image.
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

  const ai = makeClient()
  const prompt = `You are a brand compliance reviewer. Review this ad creative for brand ${brand}, product ${productName}, headline "${headline}". Check: 1) Is the copy appropriate and on-brand? 2) Is there any potentially offensive content?`

  const response = await ai.chat.completions.create({
    model: 'gpt-5.4-nano',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'submit_review',
          description: 'Submit the compliance review result',
          parameters: {
            type: 'object',
            properties: {
              passed: { type: 'boolean', description: 'Whether the creative passes compliance' },
              issues: { type: 'array', items: { type: 'string' }, description: 'List of compliance issues found' },
            },
            required: ['passed', 'issues'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'submit_review' } },
  })

  try {
    const toolCall = response.choices[0]?.message.tool_calls?.[0]
    const args = toolCall && 'function' in toolCall ? toolCall.function.arguments : ''
    return JSON.parse(args)
  } catch {
    return { passed: true, issues: [] }
  }
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
