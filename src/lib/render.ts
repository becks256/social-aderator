import sharp from 'sharp'
import { TEMPLATES } from './templates'
import type { AspectRatio, MarketCopy } from './types'
import type { TextZone } from './templates'

// Approximate char width as 0.55 * fontSize
const CHAR_WIDTH_RATIO = 0.55

export function detectOverflow(text: string, zoneWidth: number, fontSize: number): boolean {
  return text.length * fontSize * CHAR_WIDTH_RATIO > zoneWidth
}

export function wrapText(text: string, zoneWidth: number, fontSize: number): string[] {
  const maxCharsPerLine = Math.floor(zoneWidth / (fontSize * CHAR_WIDTH_RATIO))
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxCharsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSvgText(text: string, zone: TextZone, canvas: { width: number; height: number }): string {
  const lines = wrapText(text, zone.width, zone.fontSize)
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? zone.fontSize : zone.lineHeight
      return `<tspan x="${zone.x}" dy="${dy}">${escapeXml(line)}</tspan>`
    })
    .join('\n')

  return `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <text font-family="Arial, Helvetica, sans-serif" font-size="${zone.fontSize}" fill="${zone.color}" x="${zone.x}" y="${zone.y}">
    ${tspans}
  </text>
</svg>`
}

function buildCtaSvg(text: string, zone: { x: number; y: number; width: number; height: number; fontSize: number; color: string; bg: string; radius: number }, canvas: { width: number; height: number }): string {
  return `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="${zone.radius}" fill="${zone.bg}"/>
  <text x="${zone.x + zone.width / 2}" y="${zone.y + zone.height / 2 + zone.fontSize * 0.35}"
    font-family="Arial, Helvetica, sans-serif" font-size="${zone.fontSize}"
    fill="${zone.color}" text-anchor="middle">${escapeXml(text)}</text>
</svg>`
}

export interface RenderInput {
  heroBuffer: Buffer
  packshotBuffer: Buffer
  logoBuffer: Buffer
  copy: MarketCopy
  aspectRatio: AspectRatio
}

export async function renderCreative(input: RenderInput): Promise<Buffer> {
  const t = TEMPLATES[input.aspectRatio]
  const { canvas } = t

  // Build background for 16:9 (dark right column)
  const bg = input.aspectRatio === '16:9'
    ? await sharp({
        create: { width: canvas.width, height: canvas.height, channels: 4, background: '#f8f8f8' },
      })
        .composite([{
          input: await sharp({
            create: { width: t.hero.width === 1056 ? canvas.width - 1056 : 0, height: canvas.height, channels: 4, background: '#1e293b' },
          }).png().toBuffer(),
          left: 1056, top: 0,
        }])
        .png()
        .toBuffer()
    : await sharp({
        create: { width: canvas.width, height: canvas.height, channels: 4, background: '#ffffff' },
      }).png().toBuffer()

  // Resize source images to fit zones
  const hero = await sharp(input.heroBuffer)
    .resize(t.hero.width, t.hero.height, { fit: 'cover' })
    .png()
    .toBuffer()

  const packshot = await sharp(input.packshotBuffer)
    .resize(t.packshot.width, t.packshot.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const logo = await sharp(input.logoBuffer)
    .resize(t.logo.width, t.logo.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // SVG text buffers — all sized to the full canvas so Sharp never rejects the composite
  const headlineSvg = Buffer.from(buildSvgText(input.copy.headline, t.text, canvas))
  const bodySvg = Buffer.from(buildSvgText(input.copy.body, t.bodyText, canvas))
  const ctaSvg = Buffer.from(buildCtaSvg(input.copy.cta, t.cta, canvas))

  const layers: sharp.OverlayOptions[] = [
    { input: hero, left: t.hero.x, top: t.hero.y },
    { input: packshot, left: t.packshot.x, top: t.packshot.y },
    { input: logo, left: t.logo.x, top: t.logo.y },
    { input: headlineSvg, left: 0, top: 0 },
    { input: bodySvg, left: 0, top: 0 },
    { input: ctaSvg, left: 0, top: 0 },
  ]

  if (input.copy.disclaimer) {
    const disclaimerSvg = Buffer.from(buildSvgText(input.copy.disclaimer, t.disclaimer, canvas))
    layers.push({ input: disclaimerSvg, left: 0, top: 0 })
  }

  return sharp(bg).composite(layers).png().toBuffer()
}
