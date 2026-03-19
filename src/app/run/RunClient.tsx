// src/app/run/RunClient.tsx
'use client'

import React, { useState } from 'react'
import type { CampaignBrief } from '@/lib/types'

interface LogLine {
  step: string
  status: 'running' | 'done' | 'error'
  detail?: string
  artifactId?: string
}

export default function RunClient() {
  const [briefText, setBriefText] = useState('')
  const [parsed, setParsed] = useState<CampaignBrief | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'done'>>({})
  const [log, setLog] = useState<LogLine[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [artifactCount, setArtifactCount] = useState(0)

  function tryParseBrief(text: string) {
    // js-yaml is server-only; delegate parsing to the server route
    fetch('/api/pipeline/parse-brief', {
      method: 'POST',
      body: text,
      headers: { 'Content-Type': 'text/plain' },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setParseError(data.error)
          setParsed(null)
        } else {
          setParsed(data.brief)
          setParseError(null)
        }
      })
      .catch(() => setParseError('Network error — could not parse brief'))
  }

  async function handleUpload(campaignId: string, productId: string, assetType: string, file: File) {
    const key = `${productId}-${assetType}`
    setUploadStatus(s => ({ ...s, [key]: 'uploading' }))
    const form = new FormData()
    form.append('campaignId', campaignId)
    form.append('file', file)
    await fetch('/api/assets/upload', { method: 'POST', body: form })
    setUploadStatus(s => ({ ...s, [key]: 'done' }))
  }

  async function runPipeline() {
    if (!briefText.trim()) return
    setLog([])
    setDone(false)
    setArtifactCount(0)
    setRunning(true)
    sessionStorage.setItem('pipelineRunning', 'true')

    const response = await fetch('/api/pipeline/run', {
      method: 'POST',
      body: briefText,
      headers: { 'Content-Type': 'text/plain' },
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done: streamDone, value } = await reader.read()
      if (streamDone) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() ?? ''

      for (const chunk of lines) {
        const dataLine = chunk.split('\n').find(l => l.startsWith('data: '))
        if (!dataLine) continue
        try {
          const event = JSON.parse(dataLine.slice(6))
          if (event.type === 'step') {
            setLog(l => [...l, event])
          } else if (event.type === 'artifact') {
            setArtifactCount(n => n + 1)
          } else if (event.type === 'complete') {
            setDone(true)
            sessionStorage.removeItem('pipelineRunning')
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    setRunning(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-xl font-semibold tracking-tight mb-1">New Campaign Run</h1>
      <p className="text-sm text-gray-400 mb-8">Paste a brief, upload assets, then run the pipeline.</p>

      {/* Brief textarea */}
      <section className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Campaign Brief (YAML or JSON)
        </label>
        <textarea
          className="w-full h-40 border border-gray-200 rounded-lg bg-white px-4 py-3 font-mono text-sm text-gray-700 resize-y outline-none focus:border-gray-400 transition-colors"
          placeholder={'campaign:\n  id: summer-glow-2026\n  name: Summer Glow 2026\n  ...'}
          value={briefText}
          onChange={e => {
            setBriefText(e.target.value)
            tryParseBrief(e.target.value)
          }}
        />
        {parseError && <p className="mt-2 text-xs text-red-500">{parseError}</p>}
      </section>

      {/* Asset upload */}
      {parsed && (
        <section className="mb-8">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Assets</label>
          <div className="grid grid-cols-2 gap-3">
            {parsed.products.map(product => (
              <React.Fragment key={product.id}>
                {/* Hero */}
                <label
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    uploadStatus[`${product.id}-hero`] === 'done'
                      ? 'border-green-200 bg-green-50'
                      : 'border-dashed border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {product.name} — Hero
                  </div>
                  {product.hero ? (
                    <div className="text-xs text-gray-400">{product.hero}</div>
                  ) : (
                    <div className="text-xs text-gray-400">Missing — will be generated by Gemini</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(parsed.campaign.id, product.id, 'hero', file)
                    }}
                  />
                </label>
                {/* Packshot */}
                <label
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    uploadStatus[`${product.id}-packshot`] === 'done'
                      ? 'border-green-200 bg-green-50'
                      : 'border-dashed border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {product.name} — Packshot
                  </div>
                  <div className="text-xs text-gray-400">{product.packshot}</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(parsed.campaign.id, product.id, 'packshot', file)
                    }}
                  />
                </label>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Run button */}
      <button
        onClick={runPipeline}
        disabled={running || !briefText.trim()}
        className="w-full py-3 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40 hover:opacity-85 transition-opacity"
      >
        {running ? 'Running\u2026' : 'Run Pipeline \u2192'}
      </button>

      {/* Log */}
      {log.length > 0 && (
        <div className="mt-6 border border-gray-100 rounded-lg overflow-hidden">
          <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-600">
              {running ? `Running \u2014 ${artifactCount} artifact${artifactCount !== 1 ? 's' : ''} complete` : `Done \u2014 ${artifactCount} artifacts`}
            </span>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {log.map((line, i) => (
              <div key={i} className="flex items-baseline gap-3 text-xs">
                <span className="font-mono text-gray-400 w-24 flex-shrink-0">{line.step}</span>
                <span className={
                  line.status === 'done' ? 'text-green-600' :
                  line.status === 'error' ? 'text-red-500' : 'text-blue-500'
                }>
                  {line.status === 'done' ? '\u2713' : line.status === 'error' ? '\u2717' : '\u27f3'}{' '}
                  {line.detail ?? line.status}
                </span>
              </div>
            ))}
          </div>
          {(artifactCount > 0 || done) && (
            <div className="px-4 pb-4">
              <a
                href="/review"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 border border-blue-100 bg-blue-50 px-4 py-2 rounded-full"
              >
                View in Review Workspace \u2192
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
