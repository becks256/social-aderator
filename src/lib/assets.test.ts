import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { resolveAssets } from "./assets";
import type { CampaignBrief } from "./types";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aderator-assets-"));
  process.env.STORAGE_ROOT = tmpRoot;
  // create asset dir and seed files
  const assetDir = path.join(tmpRoot, "assets", "camp");
  await fs.mkdir(assetDir, { recursive: true });
  await fs.writeFile(path.join(assetDir, "hero.jpg"), "fake");
  await fs.writeFile(path.join(assetDir, "pack.png"), "fake");
  await fs.writeFile(path.join(assetDir, "logo.png"), "fake");
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  delete process.env.STORAGE_ROOT;
});

const brief: CampaignBrief = {
  campaign: { id: "camp", name: "C", brand: "B", markets: ["en-US"] },
  products: [
    {
      id: "prod-a",
      name: "A",
      tagline: "t",
      hero: "hero.jpg",
      packshot: "pack.png",
      logo: "logo.png",
    },
    {
      id: "prod-b",
      name: "B",
      tagline: "t",
      packshot: "pack.png",
      logo: "logo.png",
    }, // no hero
  ],
  copy: {},
  constraints: {
    maxHeadlineChars: 40,
    requireDisclaimer: false,
    safeZonePercent: 90,
  },
};

describe("resolveAssets", () => {
  it("marks existing hero as found", async () => {
    const result = await resolveAssets(brief);
    expect(result["prod-a"].heroFound).toBe(true);
    expect(result["prod-a"].heroPath).toContain("hero.jpg");
  });

  it("marks missing hero as not found", async () => {
    const result = await resolveAssets(brief);
    expect(result["prod-b"].heroFound).toBe(false);
  });

  it("resolves packshot and logo paths", async () => {
    const result = await resolveAssets(brief);
    expect(result["prod-a"].packshot).toContain("pack.png");
    expect(result["prod-a"].logo).toContain("logo.png");
  });

  it("flags missing packshot as not found", async () => {
    const missingPackshot: CampaignBrief = {
      ...brief,
      products: [{ ...brief.products[0], packshot: "missing-pack.png" }],
    };
    const result = await resolveAssets(missingPackshot);
    expect(result["prod-a"].packshotFound).toBe(false);
  });
});
