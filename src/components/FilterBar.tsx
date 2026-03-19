// src/components/FilterBar.tsx
'use client'

interface FilterBarProps {
  products: string[]
  markets: string[]
  activeProduct: string
  activeMarket: string
  activeRatio: string
  activeState: string
  onChange: (key: string, value: string) => void
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-all ${
        active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-gray-200 mx-1" />
}

export function FilterBar({ products, markets, activeProduct, activeMarket, activeRatio, activeState, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill label="All Products" active={activeProduct === ''} onClick={() => onChange('product', '')} />
      {products.map(p => <Pill key={p} label={p} active={activeProduct === p} onClick={() => onChange('product', p)} />)}

      <Divider />

      {markets.map(m => <Pill key={m} label={m} active={activeMarket === m} onClick={() => onChange('market', m)} />)}
      {activeMarket !== '' && <Pill label="All Markets" active={false} onClick={() => onChange('market', '')} />}

      <Divider />

      {['1:1', '9:16', '16:9'].map(r => <Pill key={r} label={r} active={activeRatio === r} onClick={() => onChange('ratio', activeRatio === r ? '' : r)} />)}

      <Divider />

      {['in_review', 'approved', 'flagged'].map(s => (
        <Pill key={s} label={s.replace('_', ' ')} active={activeState === s} onClick={() => onChange('state', activeState === s ? '' : s)} />
      ))}
    </div>
  )
}
