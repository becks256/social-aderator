import { describe, it, expect } from "vitest";
import { TEMPLATES } from "./templates";

describe("TEMPLATES", () => {
  it("defines all three aspect ratios", () => {
    expect(TEMPLATES["1:1"]).toBeDefined();
    expect(TEMPLATES["9:16"]).toBeDefined();
    expect(TEMPLATES["16:9"]).toBeDefined();
  });

  it("1:1 canvas is 1080x1080", () => {
    expect(TEMPLATES["1:1"].canvas).toEqual({ width: 1080, height: 1080 });
  });

  it("9:16 canvas is 1080x1920", () => {
    expect(TEMPLATES["9:16"].canvas).toEqual({ width: 1080, height: 1920 });
  });

  it("16:9 canvas is 1920x1080", () => {
    expect(TEMPLATES["16:9"].canvas).toEqual({ width: 1920, height: 1080 });
  });

  it("all templates have hero, text, logo, packshot, cta zones", () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.hero).toBeDefined();
      expect(t.text).toBeDefined();
      expect(t.logo).toBeDefined();
      expect(t.packshot).toBeDefined();
      expect(t.cta).toBeDefined();
    }
  });

  it("9:16 has a safeZone", () => {
    expect(TEMPLATES["9:16"].safeZone).toBeDefined();
  });
});
