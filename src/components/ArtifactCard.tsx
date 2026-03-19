// src/components/ArtifactCard.tsx
'use client'

import { useState, useRef } from 'react'
import { Tag } from './Tag'
import { StatusBadge } from './StatusBadge'
import type { ArtifactManifest, ReviewAction } from '@/lib/types'

const RATIO_CLASS: Record<string, string> = {
  '1:1':  'aspect-square',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
}

interface Props {
  manifest: ArtifactManifest
}

export function ArtifactCard({ manifest: initial }: Props) {
  const [manifest, setManifest] = useState(initial)
  const [commenting, setCommenting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('Anonymous')
  const dialogRef = useRef<HTMLDialogElement>(null)

  async function dispatch(action: ReviewAction) {
    const res = await fetch(`/api/review/${manifest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    })
    if (res.ok) setManifest(await res.json())
  }

  const imgSrc = `/api/outputs/${manifest.outputPath}`
  const borderColor = manifest.state === 'approved' ? 'border-green-200' :
                      manifest.state === 'flagged'   ? 'border-red-200'   : 'border-gray-100'

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${borderColor}`}>
      {/* Thumbnail */}
      <div
        className={`w-full ${RATIO_CLASS[manifest.aspectRatio]} bg-gray-50 overflow-hidden cursor-zoom-in`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <img src={imgSrc} alt={`${manifest.productId} ${manifest.market} ${manifest.aspectRatio}`} className="w-full h-full object-cover" />
      </div>

      {/* Preview modal */}
      <dialog
        ref={dialogRef}
        className="backdrop:bg-black/70 bg-transparent p-0 max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden outline-none"
        onClick={e => { if (e.target === dialogRef.current) dialogRef.current.close() }}
      >
        <img
          src={imgSrc}
          alt={`${manifest.productId} ${manifest.market} ${manifest.aspectRatio}`}
          className="block max-w-[90vw] max-h-[90vh] object-contain"
        />
      </dialog>

      <div className="p-3">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          <Tag label={manifest.aspectRatio} variant="ratio" />
          <Tag label={manifest.market} variant="market" />
          <Tag label={manifest.compliance.passed ? '✓ compliant' : '✗ non-compliant'} variant={manifest.compliance.passed ? 'ok' : 'fail'} />
          <Tag label={`hero: ${manifest.assetProvenance.hero}`} variant={manifest.assetProvenance.hero === 'brief' ? 'brief' : 'openai'} />
        </div>

        {/* Status */}
        <StatusBadge state={manifest.state} />

        {/* Flag reason */}
        {manifest.state === 'flagged' && manifest.review.flaggedReason && (
          <p className="mt-1.5 text-[10px] text-red-500 bg-red-50 rounded px-2 py-1">{manifest.review.flaggedReason}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-50">
          <button
            onClick={() => dispatch({ action: 'heart' })}
            className={`text-xs flex items-center gap-1 ${manifest.review.hearts > 0 ? 'text-red-400' : 'text-gray-300 hover:text-gray-500'} transition-colors`}
          >
            {manifest.review.hearts > 0 ? '♥' : '♡'} {manifest.review.hearts}
          </button>
          <button
            onClick={() => setCommenting(c => !c)}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            💬 {manifest.review.comments.length}
          </button>
          <div className="flex-1" />
          {manifest.state !== 'approved' && (
            <button
              onClick={() => dispatch({ action: 'approve', approvedBy: 'Reviewer' })}
              className="text-[10px] px-2.5 py-1 rounded-full border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              Approve
            </button>
          )}
          {manifest.state !== 'flagged' && (
            <button
              onClick={() => {
                const reason = window.prompt('Flag reason?')
                if (reason) dispatch({ action: 'flag', reason })
              }}
              className="text-[10px] px-2.5 py-1 rounded-full border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Flag
            </button>
          )}
        </div>

        {/* Comment form */}
        {commenting && (
          <div className="mt-2 flex flex-col gap-1.5">
            <input
              className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="Your name"
              value={commentAuthor}
              onChange={e => setCommentAuthor(e.target.value)}
            />
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    dispatch({ action: 'comment', author: commentAuthor || 'Anonymous', text: commentText })
                    setCommentText('')
                    setCommenting(false)
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-900 text-white rounded"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
