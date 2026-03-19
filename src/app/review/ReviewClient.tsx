// src/app/review/ReviewClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArtifactCard } from '@/components/ArtifactCard/ArtifactCard'
import { FilterBar } from '@/components/FilterBar/FilterBar'
import type { ArtifactManifest } from '@/lib/types'

interface Props {
  initialManifests: ArtifactManifest[]
}

export default function ReviewClient({ initialManifests }: Props) {
  const [manifests, setManifests] = useState(initialManifests)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter state lives in URL query params for shareability
  const filterProduct = searchParams.get('product') ?? ''
  const filterMarket  = searchParams.get('market')  ?? ''
  const filterRatio   = searchParams.get('ratio')   ?? ''
  const filterState   = searchParams.get('state')   ?? ''

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`/review?${params.toString()}`, { scroll: false })
  }

  // Poll for new manifests while pipeline is running
  useEffect(() => {
    const isRunning = () => sessionStorage.getItem('pipelineRunning') === 'true'
    if (!isRunning()) return

    const interval = setInterval(async () => {
      if (!isRunning()) { clearInterval(interval); return }
      const res = await fetch('/api/pipeline/manifests')
      if (res.ok) {
        const fresh: ArtifactManifest[] = await res.json()
        setManifests(fresh)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const filtered = manifests.filter(m => {
    if (filterProduct && m.productId !== filterProduct) return false
    if (filterMarket && m.market !== filterMarket) return false
    if (filterRatio && m.aspectRatio !== filterRatio) return false
    if (filterState && m.state !== filterState) return false
    return true
  })

  const products = [...new Set(manifests.map(m => m.productId))]
  const markets = [...new Set(manifests.map(m => m.market))]

  async function copyReviewUrl() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="flex items-baseline gap-4 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {manifests[0]?.campaignId ?? 'Review Workspace'}
        </h1>
        <span className="text-sm text-gray-400">
          {manifests.length} artifact{manifests.length !== 1 ? 's' : ''} · {products.length} product{products.length !== 1 ? 's' : ''} · {markets.length} market{markets.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        <a href="/run" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          + New run
        </a>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          products={products}
          markets={markets}
          activeProduct={filterProduct}
          activeMarket={filterMarket}
          activeRatio={filterRatio}
          activeState={filterState}
          onChange={handleFilterChange}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-300 text-sm">
          {manifests.length === 0 ? 'No artifacts yet. Run a pipeline to get started.' : 'No artifacts match your filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(m => (
            <ArtifactCard key={m.id} manifest={m} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 flex items-center gap-3">
        <span className="text-xs font-mono text-gray-300 truncate max-w-md">
          {typeof window !== 'undefined' ? window.location.href : ''}
        </span>
        <button
          onClick={copyReviewUrl}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-400 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
