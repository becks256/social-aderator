import { promises as fs } from 'fs'
import path from 'path'
import { assetDir } from './storage'
import type { CampaignBrief } from './types'

export interface ResolvedAssets {
  heroFound: boolean
  heroPath: string | null   // absolute path if found, null if needs generation
  packshot: string          // absolute path
  packshotFound: boolean
  logo: string              // absolute path
  logoFound: boolean
}

export async function resolveAssets(
  brief: CampaignBrief
): Promise<Record<string, ResolvedAssets>> {
  const dir = assetDir(brief.campaign.id)
  const result: Record<string, ResolvedAssets> = {}

  for (const product of brief.products) {
    const heroPath = product.hero ? path.join(dir, product.hero) : null
    const heroFound = heroPath ? await fileExists(heroPath) : false
    const packshotPath = path.join(dir, product.packshot)
    const logoPath = path.join(dir, product.logo)

    result[product.id] = {
      heroFound,
      heroPath: heroFound ? heroPath : null,
      packshot: packshotPath,
      packshotFound: await fileExists(packshotPath),
      logo: logoPath,
      logoFound: await fileExists(logoPath),
    }
  }

  return result
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
