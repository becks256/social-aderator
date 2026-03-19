import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  writeManifest,
  readManifest,
  listManifests,
  assetDir,
  outputDir,
  briefPath,
} from "./storage";
import type { ArtifactManifest } from "./types";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aderator-"));
  process.env.STORAGE_ROOT = tmpRoot;
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  delete process.env.STORAGE_ROOT;
});

const fakeManifest = (): ArtifactManifest => ({
  id: "camp-prod-en-US-1x1",
  campaignId: "camp",
  productId: "prod",
  market: "en-US",
  aspectRatio: "1:1",
  outputPath: "outputs/camp/prod/en-US/1x1.png",
  localizedCopy: { headline: "h", body: "b", cta: "c" },
  copyProvenance: "brief",
  assetProvenance: { hero: "brief", packshot: "brief", logo: "brief" },
  compliance: { passed: true, checks: [] },
  state: "in_review",
  review: { hearts: 0, comments: [] },
  createdAt: new Date().toISOString(),
});

describe("storage", () => {
  it("writes and reads a manifest", async () => {
    const m = fakeManifest();
    await writeManifest(m);
    const result = await readManifest(m.id);
    expect(result?.id).toBe(m.id);
    expect(result?.state).toBe("in_review");
  });

  it("listManifests returns all written manifests", async () => {
    const m = fakeManifest();
    await writeManifest(m);
    const list = await listManifests();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(m.id);
  });

  it("assetDir returns correct path", () => {
    expect(assetDir("my-campaign")).toContain("assets/my-campaign");
  });

  it("outputDir returns correct path", () => {
    expect(outputDir("c", "p", "en-US")).toContain("outputs/c/p/en-US");
  });

  it("briefPath returns correct path", () => {
    expect(briefPath("my-campaign")).toContain("briefs/my-campaign.yaml");
  });
});
