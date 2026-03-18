import { promises as fs } from 'fs'
import path from 'path'
import type { ArtifactManifest } from './types'

function storageRoot(): string {
  return process.env.STORAGE_ROOT ?? path.join(process.cwd(), 'storage')
}

export function assetDir(campaignId: string): string {
  return path.join(storageRoot(), 'assets', campaignId)
}

export function outputDir(campaignId: string, productId: string, market: string): string {
  return path.join(storageRoot(), 'outputs', campaignId, productId, market)
}

export function manifestsDir(): string {
  return path.join(storageRoot(), 'manifests')
}

export function briefPath(campaignId: string): string {
  return path.join(storageRoot(), 'briefs', `${campaignId}.yaml`)
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export async function writeManifest(manifest: ArtifactManifest): Promise<void> {
  const dir = manifestsDir()
  await ensureDir(dir)
  await fs.writeFile(
    path.join(dir, `${manifest.id}.json`),
    JSON.stringify(manifest, null, 2),
    'utf8'
  )
}

export async function readManifest(id: string): Promise<ArtifactManifest | null> {
  try {
    const raw = await fs.readFile(path.join(manifestsDir(), `${id}.json`), 'utf8')
    return JSON.parse(raw) as ArtifactManifest
  } catch {
    return null
  }
}

export async function updateManifest(
  id: string,
  updater: (m: ArtifactManifest) => ArtifactManifest
): Promise<ArtifactManifest | null> {
  const m = await readManifest(id)
  if (!m) return null
  const updated = updater(m)
  await writeManifest(updated)
  return updated
}

export async function listManifests(): Promise<ArtifactManifest[]> {
  const dir = manifestsDir()
  try {
    const files = await fs.readdir(dir)
    const jsons = files.filter(f => f.endsWith('.json'))
    const manifests = await Promise.all(
      jsons.map(async f => {
        const raw = await fs.readFile(path.join(dir, f), 'utf8')
        return JSON.parse(raw) as ArtifactManifest
      })
    )
    return manifests
  } catch {
    return []
  }
}

export async function writeOutput(
  campaignId: string,
  productId: string,
  market: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const dir = outputDir(campaignId, productId, market)
  await ensureDir(dir)
  const fullPath = path.join(dir, filename)
  await fs.writeFile(fullPath, buffer)
  // return relative path from storageRoot
  return path.relative(storageRoot(), fullPath)
}

export async function readAsset(campaignId: string, filename: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(assetDir(campaignId), filename))
  } catch {
    return null
  }
}

export async function writeAsset(campaignId: string, filename: string, buffer: Buffer): Promise<void> {
  const dir = assetDir(campaignId)
  await ensureDir(dir)
  await fs.writeFile(path.join(dir, filename), buffer)
}

export async function resolveOutputPath(relativePath: string): Promise<string> {
  return path.join(storageRoot(), relativePath)
}
