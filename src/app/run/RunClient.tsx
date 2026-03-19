// src/app/run/RunClient.tsx
'use client'

import React, { useState } from 'react'
import type { CampaignBrief } from '@/lib/types'

interface LogLine {
  step: string
  status: 'running' | 'done' | 'error'
  detail?: string
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
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

  async function handleUpload(campaignId: string, key: string, targetFilename: string, file: File) {
    setUploadStatus(s => ({ ...s, [key]: 'uploading' }))
    const form = new FormData()
    form.append('campaignId', campaignId)
    form.append('filename', targetFilename)
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
            setLog(l => {
              // Errors always append so they stay visible even as the step continues.
              // Running/done replace the most recent running entry for that step.
              if (event.status === 'error') {
                return [...l, event]
              }
              const idx = l.findIndex(e => e.step === event.step && e.status === 'running')
              if (idx !== -1) {
                const next = [...l]
                next[idx] = event
                return next
              }
              return [...l, event]
            })
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

  function assetTile(
    label: string,
    filename: string | undefined,
    missingNote: string,
    key: string,
    onFile: (f: File) => void
  ) {
    const status = uploadStatus[key]
    return (
      <label
        key={key}
        className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col gap-1 ${
          status === 'done'
            ? 'border-green-200 bg-green-50'
            : status === 'uploading'
            ? 'border-blue-200 bg-blue-50'
            : 'border-dashed border-gray-200 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {status === 'done' ? (
            <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : status === 'uploading' ? (
            <svg className="animate-spin w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        {status === 'done' ? (
          <div className="text-[10px] text-green-600">Uploaded</div>
        ) : status === 'uploading' ? (
          <div className="text-[10px] text-blue-400">Uploading…</div>
        ) : filename ? (
          <div className="text-[10px] text-gray-400 truncate">{filename}</div>
        ) : (
          <div className="text-[10px] text-gray-400">{missingNote}</div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
          }}
        />
      </label>
    )
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
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Assets
          </label>
          <div className="space-y-4">
            {/* Campaign-level logo (shared across all products) */}
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1.5">
                {parsed.campaign.name} — Brand Logo
              </div>
              <div className="grid grid-cols-3 gap-2">
                {assetTile(
                  'Logo',
                  parsed.campaign.logo,
                  `Will be saved as ${parsed.campaign.id}-logo.png`,
                  'campaign-logo',
                  f => handleUpload(parsed.campaign.id, 'campaign-logo', parsed.campaign.logo ?? `${parsed.campaign.id}-logo.png`, f)
                )}
              </div>
            </div>

            {/* Per-product: hero + packshot (+ logo override if explicitly set in brief) */}
            {parsed.products.map(product => (
              <div key={product.id}>
                <div className="text-xs text-gray-500 font-medium mb-1.5">{product.name}</div>
                <div className="grid grid-cols-3 gap-2">
                  {assetTile(
                    'Hero',
                    product.hero,
                    'Will be generated by OpenAI',
                    `${product.id}-hero`,
                    f => handleUpload(parsed.campaign.id, `${product.id}-hero`, product.hero ?? f.name, f)
                  )}
                  {assetTile(
                    'Packshot',
                    product.packshot,
                    `Will be saved as ${product.id}-packshot.png`,
                    `${product.id}-packshot`,
                    f => handleUpload(parsed.campaign.id, `${product.id}-packshot`, product.packshot ?? `${product.id}-packshot.png`, f)
                  )}
                  {product.logo && assetTile(
                    'Logo (override)',
                    product.logo,
                    '',
                    `${product.id}-logo`,
                    f => handleUpload(parsed.campaign.id, `${product.id}-logo`, product.logo!, f)
                  )}
                </div>
              </div>
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
            {running ? (
              <>
                <Spinner />
                <span className="text-xs font-medium text-gray-600">
                  Running &mdash; {artifactCount} artifact{artifactCount !== 1 ? 's' : ''} complete
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-xs font-medium text-gray-600">
                  Done &mdash; {artifactCount} artifact{artifactCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {log.map((line, i) => {
              const isSubError = line.status === 'error' && log.slice(0, i).some(e => e.step === line.step)
              return (
                <div key={i} className={`flex items-center gap-2.5 text-xs ${isSubError ? 'pl-6' : ''}`}>
                  {isSubError ? (
                    <span className="text-gray-300 flex-shrink-0">↳</span>
                  ) : (
                    <span className="font-mono text-gray-400 w-24 flex-shrink-0">{line.step}</span>
                  )}
                  {line.status === 'running' ? (
                    <Spinner />
                  ) : (
                    <span className={line.status === 'done' ? 'text-green-600' : 'text-red-500'}>
                      {line.status === 'done' ? '✓' : '✗'}
                    </span>
                  )}
                  <span className={
                    line.status === 'done' ? 'text-gray-600' :
                    line.status === 'error' ? 'text-red-500' : 'text-blue-500'
                  }>
                    {line.detail ?? line.status}
                  </span>
                </div>
              )
            })}
          </div>
          {(artifactCount > 0 || done) && (
            <div className="px-4 pb-4">
              <a
                href="/review"
                className="inline-flex items-center gap-1.5 text-xs text-blue-500 border border-blue-100 bg-blue-50 px-4 py-2 rounded-full"
              >
                View in Review Workspace →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
