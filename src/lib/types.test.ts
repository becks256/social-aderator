import { describe, it, expect } from "vitest";
import type { ArtifactManifest, CampaignBrief, ReviewAction } from "./types";

describe("types", () => {
  it("ReviewAction union accepts all action shapes", () => {
    const actions: ReviewAction[] = [
      { action: "heart" },
      { action: "approve", approvedBy: "Alice" },
      { action: "flag", reason: "off-brand" },
      { action: "comment", author: "Bob", text: "Looks great" },
    ];
    expect(actions).toHaveLength(4);
  });

  it("ArtifactManifest has required shape", () => {
    const m: ArtifactManifest = {
      id: "a",
      campaignId: "c",
      productId: "p",
      market: "en-US",
      aspectRatio: "1:1",
      outputPath: "outputs/c/p/en-US/1x1.png",
      localizedCopy: { headline: "h", body: "b", cta: "c" },
      copyProvenance: "brief",
      assetProvenance: { hero: "brief", packshot: "brief", logo: "brief" },
      compliance: { passed: true, checks: [] },
      state: "generated",
      review: { hearts: 0, comments: [] },
      createdAt: new Date().toISOString(),
    };
    expect(m.id).toBe("a");
    expect(m.aspectRatio).toBe("1:1");
  });
});
