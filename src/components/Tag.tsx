// src/components/Tag.tsx
type TagVariant = 'ratio' | 'market' | 'product' | 'ok' | 'fail' | 'gemini' | 'brief'

const VARIANT_CLASSES: Record<TagVariant, string> = {
  ratio:   'bg-gray-100 text-gray-600',
  market:  'bg-blue-50 text-blue-600',
  product: 'bg-violet-50 text-violet-600',
  ok:      'bg-green-50 text-green-700',
  fail:    'bg-red-50 text-red-600',
  gemini:  'bg-yellow-50 text-yellow-700',
  brief:   'bg-gray-100 text-gray-500',
}

export function Tag({ label, variant }: { label: string; variant: TagVariant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  )
}
