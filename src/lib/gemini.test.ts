import { describe, it, expect } from 'vitest'
import { generateHeroImage, isMockMode } from './gemini'

describe('gemini (mock mode)', () => {
  it('isMockMode returns true when no API key', () => {
    const orig = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    expect(isMockMode()).toBe(true)
    process.env.GEMINI_API_KEY = orig
  })

  it('generateHeroImage returns a Buffer in mock mode', async () => {
    const orig = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    const buf = await generateHeroImage('Product A', 'Great product', 'Acme')
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
    process.env.GEMINI_API_KEY = orig
  })
})
