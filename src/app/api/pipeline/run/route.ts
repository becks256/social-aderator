// src/app/api/pipeline/run/route.ts
import { NextRequest } from "next/server";
import { parseBrief, validateBrief } from "@/lib/brief";
import { resolveAssets } from "@/lib/assets";
import {
  generateHeroImage,
  reviewCompliance,
  generatePlaceholderImage,
} from "@/lib/openai";
import { localizeMarketCopy } from "@/lib/localize";
import { renderCreative } from "@/lib/render";
import { TEMPLATES } from "@/lib/templates";
import { detectOverflow } from "@/lib/render";
import {
  runStructuralChecks,
  runBriefChecks,
  aggregateChecks,
} from "@/lib/compliance";
import { effectiveFilename } from "@/lib/assets";
import { createManifest } from "@/lib/manifest";
import {
  writeOutput,
  writeManifest,
  writeAsset,
  readAsset,
} from "@/lib/storage";
import { isMockMode } from "@/lib/openai";
import type { AspectRatio, MarketCopy, Provenance } from "@/lib/types";

export const dynamic = "force-dynamic";

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "9:16", "16:9"];
const RATIO_FILENAME: Record<AspectRatio, string> = {
  "1:1": "1x1.png",
  "9:16": "9x16.png",
  "16:9": "16x9.png",
};

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function emit(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(new TextEncoder().encode(sse(data)));
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const runAiCompliance =
    new URL(request.url).searchParams.get("compliance") !== "0";

  const stream = new ReadableStream({
    async start(controller) {
      let totalArtifacts = 0;
      let errorCount = 0;
      let renderErrorCount = 0;

      try {
        // Step 1: Parse brief
        emit(controller, { type: "step", step: "brief", status: "running" });
        let brief;
        try {
          brief = parseBrief(body);
          validateBrief(brief);
        } catch (e) {
          emit(controller, {
            type: "step",
            step: "brief",
            status: "error",
            detail: (e as Error).message,
          });
          emit(controller, { type: "complete", total: 0, errors: 1 });
          controller.close();
          return;
        }
        emit(controller, {
          type: "step",
          step: "brief",
          status: "done",
          detail: `${brief.products.length} products, ${brief.campaign.markets.length} markets`,
        });

        // Step 2: Resolve assets
        emit(controller, { type: "step", step: "assets", status: "running" });
        const resolved = await resolveAssets(brief);
        const missingHeroes = brief.products.filter(
          (p) => !resolved[p.id].heroFound,
        );
        emit(controller, {
          type: "step",
          step: "assets",
          status: "done",
          detail: `${missingHeroes.length} missing heroes`,
        });

        // Step 3: Generate heroes per product×market for products missing a brief hero
        // generatedHeroes[productId][market] = image Buffer
        const generatedHeroes: Record<string, Record<string, Buffer>> = {};
        if (missingHeroes.length > 0) {
          const total = missingHeroes.length * brief.campaign.markets.length;
          emit(controller, {
            type: "step",
            step: "image-gen",
            status: "running",
            detail: `0 / ${total}`,
          });
          let done = 0;
          for (const product of missingHeroes) {
            generatedHeroes[product.id] = {};
            for (const market of brief.campaign.markets) {
              try {
                generatedHeroes[product.id][market] = await generateHeroImage(
                  product.name,
                  product.tagline,
                  brief.campaign.brand,
                  market,
                );
              } catch (e) {
                emit(controller, {
                  type: "step",
                  step: "image-gen",
                  status: "error",
                  detail: `${product.id}/${market}: ${(e as Error).message}`,
                });
                generatedHeroes[product.id][market] =
                  await generatePlaceholderImage(
                    product.name,
                    "#4a90d9",
                    1080,
                    1080,
                  );
              }
              done++;
              emit(controller, {
                type: "step",
                step: "image-gen",
                status: "running",
                detail: `${done} / ${total}`,
              });
            }
          }
          emit(controller, {
            type: "step",
            step: "image-gen",
            status: "done",
            detail: `${total} generated`,
          });
        }

        // Step 4: Localize copy
        emit(controller, { type: "step", step: "localize", status: "running" });
        const allCopy: Record<string, MarketCopy> = {};
        const copyProvenance: Record<string, Provenance> = {};

        for (const market of brief.campaign.markets) {
          const sourceCopy = brief.copy[market];
          if (sourceCopy) {
            allCopy[market] = sourceCopy;
            copyProvenance[market] = "brief";
          } else {
            // Find first market with copy as source
            const sourceMarket = Object.keys(brief.copy).find(
              (m) => brief.copy[m] !== null,
            );
            const source = sourceMarket
              ? brief.copy[sourceMarket]!
              : {
                  headline: brief.campaign.name,
                  body: brief.products[0]?.tagline ?? "",
                  cta: "Learn More",
                };
            allCopy[market] = await localizeMarketCopy(
              source,
              market,
              brief.campaign.brand,
              brief.products[0]?.name ?? "",
            );
            copyProvenance[market] = isMockMode() ? "mock" : "openai";
          }
        }
        emit(controller, { type: "step", step: "localize", status: "done" });

        // Steps 5–7: Render, comply, manifest (per product × market × ratio)
        for (const product of brief.products) {
          const assets = resolved[product.id];

          const packshotBuffer = (await readAsset(
            brief.campaign.id,
            product.packshot ?? effectiveFilename(product.id, "packshot"),
          ))!;
          const logoBuffer = (await readAsset(
            brief.campaign.id,
            product.logo ??
              brief.campaign.logo ??
              effectiveFilename(brief.campaign.id, "logo"),
          ))!;

          if (!packshotBuffer || !logoBuffer) {
            emit(controller, {
              type: "step",
              step: "render",
              status: "error",
              detail: `${product.id}: missing packshot or logo`,
            });
            errorCount++;
            renderErrorCount++;
            continue;
          }

          for (const market of brief.campaign.markets) {
            const copy = allCopy[market];

            // Hero is market-specific: use brief asset if present, else use generated
            const heroBuffer = assets.heroPath
              ? ((await readAsset(
                  brief.campaign.id,
                  assets.heroPath.includes("/")
                    ? assets.heroPath.split("/").pop()!
                    : assets.heroPath,
                )) ??
                (await generatePlaceholderImage(
                  product.name,
                  "#4a90d9",
                  1080,
                  1080,
                )))
              : (generatedHeroes[product.id]?.[market] ??
                (await generatePlaceholderImage(
                  product.name,
                  "#4a90d9",
                  1080,
                  1080,
                )));

            for (const ratio of ASPECT_RATIOS) {
              emit(controller, {
                type: "step",
                step: "render",
                status: "running",
                detail: `${product.id}/${market}/${ratio}`,
              });
              try {
                const imageBuffer = await renderCreative({
                  heroBuffer,
                  packshotBuffer,
                  logoBuffer,
                  copy,
                  aspectRatio: ratio,
                });

                // Compliance
                const template = TEMPLATES[ratio];
                const overflows = detectOverflow(
                  copy.headline,
                  template.text.width,
                  template.text.fontSize,
                );
                const structural = runStructuralChecks(
                  assets.heroFound,
                  assets.logoFound,
                  assets.packshotFound,
                );
                const briefChecks = runBriefChecks(
                  copy,
                  brief.constraints,
                  overflows,
                );
                let aiResult: { passed: boolean; issues: string[] } | undefined;
                if (runAiCompliance && !isMockMode()) {
                  aiResult = await reviewCompliance(
                    imageBuffer.toString("base64"),
                    product.name,
                    brief.campaign.brand,
                    copy.headline,
                  );
                }
                const complianceResult = aggregateChecks(
                  structural,
                  briefChecks,
                  aiResult,
                );

                // Save output
                const outputPath = await writeOutput(
                  brief.campaign.id,
                  product.id,
                  market,
                  RATIO_FILENAME[ratio],
                  imageBuffer,
                );

                // Create manifest
                const manifest = createManifest({
                  campaignId: brief.campaign.id,
                  productId: product.id,
                  market,
                  aspectRatio: ratio,
                  outputPath,
                  localizedCopy: copy,
                  copyProvenance: copyProvenance[market],
                  assetProvenance: {
                    hero: assets.heroFound
                      ? product.hero
                        ? "brief"
                        : isMockMode()
                          ? "mock"
                          : "openai"
                      : "mock",
                    packshot: "brief",
                    logo: "brief",
                  },
                  complianceResult,
                });
                await writeManifest(manifest);

                totalArtifacts++;
                emit(controller, {
                  type: "artifact",
                  artifactId: manifest.id,
                  productId: product.id,
                  market,
                  aspectRatio: ratio,
                });
              } catch (e) {
                emit(controller, {
                  type: "step",
                  step: "render",
                  status: "error",
                  detail: `${product.id}/${market}/${ratio}: ${(e as Error).message}`,
                });
                errorCount++;
                renderErrorCount++;
              }
            }
          }
        }

        emit(controller, {
          type: "step",
          step: "render",
          status: renderErrorCount > 0 ? "error" : "done",
          detail:
            renderErrorCount > 0
              ? `${totalArtifacts} done, ${renderErrorCount} failed`
              : `${totalArtifacts} done`,
        });
        emit(controller, {
          type: "complete",
          total: totalArtifacts,
          errors: errorCount,
        });
      } catch (e) {
        emit(controller, {
          type: "step",
          step: "pipeline",
          status: "error",
          detail: (e as Error).message,
        });
        emit(controller, {
          type: "complete",
          total: totalArtifacts,
          errors: errorCount + 1,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
