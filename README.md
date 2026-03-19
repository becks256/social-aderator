# Social Aderator

Local-first creative production pipeline and stakeholder review workspace for localized social ad campaigns.

## What it does

1. **Ingest** a campaign brief (YAML or JSON) with multiple products and markets
2. **Resolve** brand assets from local storage; upload via the UI
3. **Generate** missing hero images with GPT Image 1.5 (placeholder PNG if no API key)
4. **Localize** copy per market with OpenAI (mock translations if no API key)
5. **Render** 1:1, 9:16, and 16:9 creatives using deterministic Sharp templates
6. **Check** compliance: optional OpenAI structural + brief constraints + brand review
7. **Save** PNG outputs and JSON manifests to organized local directories
8. **Review** artifacts at `/review` — heart, comment, approve, or flag

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment (optional — works without a key)
cp .env.example .env.local

# 3. Seed demo assets
npm run seed

# 4. Start dev server
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/run`.

## Running the demo

1. Go to `/run`
2. Paste the contents of `examples/sample-brief.yaml` into the brief textarea
3. Upload packshot/logo assets if prompted (or let the seed handle it)
4. Click **Run Pipeline →**
5. Watch the SSE log — artifacts appear in real time
6. Click **View in Review Workspace →** when done

## With OpenAI

Set `OPENAI_API_KEY` in `.env.local` to enable:
- Real hero image generation for Hydra Boost Serum and Radiance SPF 50
- Real French copy localization
- OpenAI brand compliance review

Without the key, the pipeline uses placeholder images and mock translations.

## Storage layout

```
storage/
  assets/{campaignId}/     ← uploaded/seeded assets
  outputs/{campaignId}/{productId}/{market}/1x1.png …
  manifests/{artifactId}.json
  briefs/{campaignId}.yaml
```

## Architecture

- **`src/lib/`** — 10 focused modules, each with one job
- **`POST /api/pipeline/run`** — SSE pipeline, emits events per step/artifact
- **`GET /review`** — server component reads manifests; client polls for updates
- **`PATCH /api/review/[id]`** — persists heart/comment/approve/flag to manifest JSON

## Running tests

```bash
npm test
```
