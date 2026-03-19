import { describe, it, expect } from "vitest";
import { localizeMarketCopy } from "./localize";
import type { MarketCopy } from "./types";

const source: MarketCopy = {
  headline: "Your skin. Your summer.",
  body: "SPF 50 protection meets all-day radiance",
  cta: "Shop Now",
  disclaimer: "Tested by dermatologists",
};

describe("localizeMarketCopy (mock mode)", () => {
  it("returns mock copy when no API key", async () => {
    const orig = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const result = await localizeMarketCopy(source, "fr-FR", "Acme", "Product");
    expect(result.headline).toBeDefined();
    expect(result.cta).toBeDefined();
    process.env.OPENAI_API_KEY = orig;
  });

  it("mock copy preserves structure", async () => {
    const orig = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const result = await localizeMarketCopy(source, "fr-FR", "Acme", "Product");
    expect(typeof result.headline).toBe("string");
    expect(typeof result.body).toBe("string");
    expect(typeof result.cta).toBe("string");
    expect(typeof result.disclaimer).toBe("string");
    process.env.OPENAI_API_KEY = orig;
  });
});
