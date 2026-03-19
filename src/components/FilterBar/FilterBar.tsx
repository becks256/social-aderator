// src/components/FilterBar.tsx
"use client"

import { Divider } from "./components/Divider/Divider"
import { Pill } from "./components/Pill/Pill"

interface FilterBarProps {
  products: string[]
  markets: string[]
  activeProduct: string
  activeMarket: string
  activeRatio: string
  activeState: string
  onChange: (key: string, value: string) => void
}

export function FilterBar({
  products,
  markets,
  activeProduct,
  activeMarket,
  activeRatio,
  activeState,
  onChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill
        label="All Products"
        active={activeProduct === ""}
        onClick={() => onChange("product", "")}
      />
      {products.map((p) => (
        <Pill
          key={p}
          label={p}
          active={activeProduct === p}
          onClick={() => onChange("product", p)}
        />
      ))}

      <Divider />

      {markets.map((m) => (
        <Pill
          key={m}
          label={m}
          active={activeMarket === m}
          onClick={() => onChange("market", m)}
        />
      ))}
      {activeMarket !== "" && (
        <Pill
          label="All Markets"
          active={false}
          onClick={() => onChange("market", "")}
        />
      )}

      <Divider />

      {["1:1", "9:16", "16:9"].map((r) => (
        <Pill
          key={r}
          label={r}
          active={activeRatio === r}
          onClick={() => onChange("ratio", activeRatio === r ? "" : r)}
        />
      ))}

      <Divider />

      {["in_review", "approved", "flagged"].map((s) => (
        <Pill
          key={s}
          label={s.replace("_", " ")}
          active={activeState === s}
          onClick={() => onChange("state", activeState === s ? "" : s)}
        />
      ))}
    </div>
  )
}
