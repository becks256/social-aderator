# Aderator — Creative Production Pipeline & Review Workspace
**Date:** 2026-03-18
**Status:** Approved for implementation

---

## Overview

Aderator is a local-first creative production pipeline and stakeholder review workspace for localized social ad campaigns. It accepts a campaign brief (YAML or JSON), resolves brand/product assets, generates missing hero imagery via Gemini, localizes copy per market, renders deterministic creatives in 1:1 / 9:16 / 16:9 formats using Sharp, runs compliance checks, saves outputs and manifests to the local filesystem, and publishes artifacts into a minimal review workspace where stakeholders can heart, comment, approve, or flag.

**Stack:** Next.js 16.2 App Router · TypeScript · Tailwind v4 · Sharp · Gemini 2.5 Flash · local filesystem storage

---

## Goals

1. Accept a campaign brief with ≥2 products and ≥2 markets
2. Resolve and upload brand/product assets via a UI
3. Generate missing hero images with Gemini 2.5 Flash (mock fallback if no key)
4. Localize copy per market with Gemini 2.5 Flash (mock fallback if no key)
5. Render 1:1, 9:16, 16:9 creatives with deterministic Sharp templates
6. Run structural + brief-constraint + optional Gemini compliance checks
7. Persist artifacts and manifests to organized local directories
8. Provide a minimal, light-themed stakeholder review workspace at `/review`
9. Persist review actions (hearts, comments, approve, flag) to manifest JSON

---

## Architecture

### Execution model: SSE pipeline

`POST /api/pipeline/run` runs the full pipeline synchronously in a single Next.js route handler, emitting one Server-Sent Event per step/artifact. The `/run` page subscribes to the stream and displays a live log. The `/review` page polls manifests every 2 seconds while a pipeline is active and stops when a `pipeline:complete` event is received.

### App Router structure

```
src/app/
  page.tsx                          → redirect to /run
  run/
    page.tsx                        ← brief input + asset upload + SSE log
  review/
    page.tsx                        ← stakeholder review workspace
  api/
    assets/upload/route.ts          POST: save uploaded file to storage/assets/{campaignId}/
    pipeline/run/route.ts           POST: run pipeline, stream SSE events
    pipeline/manifests/route.ts     GET: return all manifest JSON objects (used by /review to poll)
    review/[artifactId]/route.ts    PATCH: persist heart/comment/approve/flag
    outputs/[...path]/route.ts      GET: serve output images from local storage
```

### Library modules (`src/lib/`)

Each module has a single responsibility:

| File | Responsibility |
|------|---------------|
| `types.ts` | All TypeScript interfaces and enums |
| `storage.ts` | Filesystem read/write helpers (briefs, assets, outputs, manifests) |
| `brief.ts` | Parse and validate YAML/JSON brief into typed `CampaignBrief` |
| `assets.ts` | Resolve asset paths from brief; flag missing assets |
| `gemini.ts` | Gemini 2.5 Flash client — image generation + mock fallback |
| `localize.ts` | Copy localization per market via Gemini; mock fallback |
| `templates.ts` | Fixed x/y layout constants for 1:1, 9:16, 16:9 |
| `render.ts` | Sharp compositor: hero → packshot → logo → SVG text layers |
| `compliance.ts` | Structural + brief-constraint + optional Gemini checks |
| `manifest.ts` | Create, read, and update artifact manifest JSON files |

---

## Data Model

### `CampaignBrief`

```ts
interface CampaignBrief {
  campaign: {
    id: string
    name: string
    brand: string
    markets: string[]           // e.g. ['en-US', 'fr-FR']
  }
  products: Product[]
  copy: Record<string, MarketCopy>   // keyed by market; null = localize via Gemini
  constraints: {
    maxHeadlineChars: number
    requireDisclaimer: boolean
    safeZonePercent: number     // e.g. 90 → 90% width safe zone for 9:16
  }
}

interface Product {
  id: string
  name: string
  tagline: string
  hero?: string        // relative asset path; absent = generate via Gemini
  packshot: string
  logo: string
}

interface MarketCopy {
  headline: string
  body: string
  cta: string
  disclaimer?: string
}
```

### `ArtifactManifest`

```ts
interface ArtifactManifest {
  id: string                        // {campaignId}-{productId}-{market}-{ratio}
  campaignId: string
  productId: string
  market: string
  aspectRatio: '1:1' | '9:16' | '16:9'
  outputPath: string                // relative: outputs/{campaignId}/{productId}/{market}/{ratio}.png

  localizedCopy: MarketCopy
  copyProvenance: 'brief' | 'gemini' | 'mock'
  assetProvenance: {
    hero: 'brief' | 'gemini' | 'mock'
    packshot: 'brief'
    logo: 'brief'
  }

  compliance: {
    passed: boolean
    checks: ComplianceCheck[]
  }

  state: 'generated' | 'in_review' | 'approved' | 'flagged'
  review: {
    hearts: number
    comments: Array<{ author: string; text: string; createdAt: string }>
    approvedBy?: string
    flaggedReason?: string
  }

  createdAt: string    // ISO 8601
}

interface ComplianceCheck {
  rule: string
  passed: boolean
  detail?: string
}
```

### SSE event shape

```ts
// step progress
{ type: 'step', step: string, status: 'running' | 'done' | 'error', detail?: string }

// artifact ready (emitted per successfully rendered + manifested creative)
{ type: 'artifact', artifactId: string, productId: string, market: string, aspectRatio: string }

// pipeline complete (emitted even if some artifacts errored)
{ type: 'complete', total: number, errors: number }
```

### Pipeline error handling

On a per-artifact error (e.g. render failure), the pipeline emits a `step` event with `status: 'error'` and `detail` containing the error message, then **continues** to the next artifact. The failed artifact is skipped (no manifest is written for it). The final `type:complete` event includes an `errors` count. A step-level error that affects all artifacts (e.g. brief parse failure) terminates the pipeline early and emits `type:complete` with `total: 0`.

---

## Storage Layout

```
storage/
  briefs/
    {campaignId}.yaml
  assets/
    {campaignId}/
      {filename}            ← uploaded via /api/assets/upload
  outputs/
    {campaignId}/
      {productId}/
        {market}/
          1x1.png
          9x16.png
          16x9.png
  manifests/
    {artifactId}.json
```

---

## Pipeline Steps (in order)

1. **Parse brief** — read YAML/JSON from request body; validate with `brief.ts`; emit `step:brief`
2. **Resolve assets** — for each product, check `storage/assets/{campaignId}/` for hero, packshot, logo; flag missing heroes; emit `step:assets`
3. **Generate missing heroes** — call `gemini.ts` for each missing hero; save PNG to `storage/assets/{campaignId}/`; emit `step:image-gen`
4. **Localize copy** — for each market with null copy, call `localize.ts`; emit `step:localize`
5. **Render creatives** — for each product × market × ratio, call `render.ts` with template from `templates.ts`; save to `storage/outputs/`; emit `type:artifact` per creative
6. **Compliance checks** — call `compliance.ts` per artifact: structural → brief constraints → Gemini (if key present); emit `step:compliance`
7. **Save manifests** — write `ArtifactManifest` JSON per artifact via `manifest.ts`; set state to `in_review`
8. **Complete** — emit `type:complete`

---

## Rendering Templates

All coordinates are fixed constants in `templates.ts`. `render.ts` reads them and calls `sharp().composite([...layers])`. Text is rendered as SVG string → `Buffer` → composited as PNG layer. Overflow is detected by comparing the text bounding box to zone width — a failed overflow check creates a failing `ComplianceCheck`.

### 1:1 — 1080×1080px
- Hero: `0,0 → 1080×648` (top 60%)
- Text strip: `y=648, h=270` (headline + body)
- Packshot: `x=756, y=810, 270×216` (bottom-right)
- Logo: `x=24, y=24, 180×72` (top-left)
- CTA button: `x=24, y=900, 216×54` (bottom-left)

### 9:16 — 1080×1920px
- Hero: `0,0 → 1080×960` (top 50%)
- Safe zone: `x=54, w=972` (90% of width — all text and logo stay within)
- Headline: `x=54, y=998`
- Body: `x=54, y=998 + headlineHeight + 16` (dynamically offset from headline SVG bbox height; line-height 40px, max 3 lines)
- Disclaimer: `x=54, y=bodyBottom + 24` (dynamically offset from body bbox; font-size 24px)
- Packshot: `x=756, y=960, 270×324` (right side, overlapping hero/text boundary)
- CTA pill: horizontally centered at `y=1680`
- Logo: `x=54, y=36` (inside safe zone, top-left)

### 16:9 — 1920×1080px
- Hero: `0,0 → 1056×1080` (left 55%)
- Text column: `x=1056, w=864` (right 45%, dark background)
- Headline: `x=1104, y=400`
- Body: below headline
- CTA button: `x=1104, y=680`
- Packshot: `x=1500, y=700, 420×324` (bottom-right of text column)
- Logo: `x=1780, y=24, 120×48` (top-right)
- Disclaimer: `x=1104, y=1040` (bottom of text column)

---

## Compliance Checks

Checks run in three layers, short-circuiting if disabled:

1. **Structural** (always): logo present, hero present, packshot present
2. **Brief constraints** (always): headline ≤ `maxHeadlineChars`, disclaimer present if `requireDisclaimer: true`, all text within safe zone (overflow detection)
3. **Gemini review** (if `GEMINI_API_KEY` present): brand voice appropriateness, copy–image alignment — result is a suggested flag, not a hard block

---

## Review Workspace (`/review`)

### UI components (all reusable)

- **`<Tag>`** — pill with variant: `ratio` | `market` | `product` | `ok` | `fail` | `gemini` | `brief`
- **`<StatusBadge>`** — dot + label: `in_review` | `approved` | `flagged`
- **`<ArtifactCard>`** — thumbnail (correct aspect ratio) + tags + status badge + heart/comment/approve/flag actions
- **`<FilterBar>`** — pill toggles grouped by product / market / ratio / state

### Behavior

- Reads all `storage/manifests/*.json` on page load (server component)
- Polls `GET /api/pipeline/manifests` every 2s while a pipeline is active; new artifacts are appended to the grid as their manifests appear. Polling stops when the `/run` page emits a `type:complete` SSE event (communicated to `/review` via a shared `sessionStorage` flag set by the trigger page).
- Filter state lives in URL query params (`?product=…&market=…&ratio=…&state=…`) for shareability
- Clicking "approve" or "flag" calls `PATCH /api/review/{artifactId}` and updates manifest JSON in-place. Request body is a discriminated union:
  ```ts
  | { action: 'heart' }
  | { action: 'approve', approvedBy: string }
  | { action: 'flag', reason: string }
  | { action: 'comment', author: string, text: string }
  ```
- Hearting toggles `review.hearts` count; comments append to `review.comments`. The comment author is a free-text field in the UI (defaulting to `"Anonymous"`); no authentication is required.
- A copyable review URL is shown at the bottom

---

## `/run` Page

Three sections:
1. **Brief** — textarea for YAML/JSON paste (also accepts `.yaml`/`.json` file drop)
2. **Assets** — one upload card per product × asset type, populated after brief is parsed. Missing heroes show "will be generated by Gemini". Cards turn green on upload.
3. **Progress log** — appears after Run is clicked; streams SSE lines. "View in Review Workspace →" appears when first artifact is ready.

---

## Gemini Integration (`gemini.ts`)

- **Image generation**: `POST` to Gemini 2.5 Flash image endpoint with a prompt derived from product name, tagline, and brand. Returns PNG buffer. Saved to `storage/assets/{campaignId}/`.
- **Copy localization**: prompt includes source copy and target locale; returns translated `MarketCopy` JSON.
- **Compliance review**: prompt includes rendered image (base64) and brief constraints; returns `{ passed: boolean, issues: string[] }`.
- **Mock fallback**: if `GEMINI_API_KEY` is not set, image gen returns a generated placeholder PNG (Sharp-drawn colored rectangle with product name), localization returns lightly modified source copy with a `[mock]` prefix, compliance always returns passed.

---

## Sample Brief (`examples/sample-brief.yaml`)

Two products; one with an existing hero (reused asset), one with a missing hero (generated by Gemini). French copy is absent (localized by Gemini). Demonstrates the full pipeline.

```yaml
campaign:
  id: summer-glow-2026
  name: Summer Glow 2026
  brand: Lumière Beauty
  markets: [en-US, fr-FR]

products:
  - id: radiance-spf50
    name: Radiance SPF 50
    tagline: "Protect your glow"
    hero: radiance-spf50-hero.jpg      # exists in storage/assets/summer-glow-2026/
    packshot: radiance-spf50-pack.png
    logo: lumiere-logo.png

  - id: hydra-boost-serum
    name: Hydra Boost Serum
    tagline: "24h deep hydration"
    # hero absent → generated by Gemini
    packshot: hydra-serum-pack.png
    logo: lumiere-logo.png

copy:
  en-US:
    headline: "Your skin. Your summer."
    body: "SPF 50 protection meets all-day radiance"
    cta: "Shop Now"
    disclaimer: "Tested by dermatologists"
  # fr-FR absent → localized by Gemini

constraints:
  maxHeadlineChars: 40
  requireDisclaimer: true
  safeZonePercent: 90
```

---

## Seeded Demo State

A seed script (`scripts/seed.ts`) creates:
- `storage/assets/summer-glow-2026/` with placeholder PNGs for the Radiance SPF 50 hero, both packshots, and logo (Sharp-drawn colored rectangles)
- No hero for Hydra Boost (to demonstrate Gemini generation)
- `storage/briefs/summer-glow-2026.yaml` from the sample brief
- Pre-run manifests are **not** seeded — the user must trigger the pipeline to generate them

---

## Environment Variables (`.env.example`)

```
GEMINI_API_KEY=          # optional — mock fallback used if absent
```

---

## Implementation Order

1. `types.ts` + `storage.ts` — foundation
2. `brief.ts` + `assets.ts` — ingest layer
3. `gemini.ts` + `localize.ts` — AI helpers
4. `templates.ts` + `render.ts` — Sharp compositor
5. `compliance.ts` + `manifest.ts` — check + persist
6. `api/pipeline/run/route.ts` — SSE orchestrator
7. `api/assets/upload` + `api/review/[id]` — supporting endpoints
8. `app/run/page.tsx` — trigger UI
9. `app/review/page.tsx` + components — review workspace
10. `scripts/seed.ts` + `examples/sample-brief.yaml` + `.env.example` + `README.md`
