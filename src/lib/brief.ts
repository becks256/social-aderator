import yaml from "js-yaml";
import type { CampaignBrief } from "./types";

export function parseBrief(input: string): CampaignBrief {
  const trimmed = input.trimStart();
  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(input) as CampaignBrief;
    }
    return yaml.load(input) as CampaignBrief;
  } catch (e) {
    throw new Error(`Failed to parse brief: ${(e as Error).message}`);
  }
}

export function validateBrief(brief: CampaignBrief): void {
  if (!brief?.campaign?.id) throw new Error("brief: campaign.id is required");
  if (!brief.campaign.name) throw new Error("brief: campaign.name is required");
  if (!brief.campaign.brand)
    throw new Error("brief: campaign.brand is required");
  if (!brief.campaign.markets?.length)
    throw new Error("brief: at least one market in markets is required");
  if (!brief.products?.length)
    throw new Error("brief: at least one item in products is required");
  for (const p of brief.products) {
    if (!p.id) throw new Error("brief: product.id is required");
  }
  if (!brief.constraints)
    throw new Error("brief: constraints block is required");
}
