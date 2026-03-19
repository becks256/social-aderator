import { describe, it, expect } from "vitest";
import { buildSvgText, detectOverflow, wrapText } from "./render";

describe("buildSvgText", () => {
  it("returns an SVG string containing the text", () => {
    const svg = buildSvgText(
      "Hello world",
      {
        x: 10,
        y: 20,
        width: 400,
        height: 60,
        fontSize: 32,
        lineHeight: 40,
        color: "#000",
      },
      { width: 1080, height: 1080 },
    );
    expect(svg).toContain("Hello world");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("escapes HTML entities in text", () => {
    const svg = buildSvgText(
      "A & B < C",
      {
        x: 0,
        y: 0,
        width: 400,
        height: 60,
        fontSize: 32,
        lineHeight: 40,
        color: "#000",
      },
      { width: 1080, height: 1080 },
    );
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&lt;");
  });
});

describe("detectOverflow", () => {
  it("returns false when text fits", () => {
    // 5 chars at 10px per char ~ 50px, zone is 200px wide
    expect(detectOverflow("Hello", 200, 32)).toBe(false);
  });

  it("returns true when text is very long", () => {
    const longText = "A".repeat(200);
    expect(detectOverflow(longText, 200, 32)).toBe(true);
  });
});

describe("wrapText", () => {
  it("splits long text into multiple lines", () => {
    const lines = wrapText(
      "The quick brown fox jumps over the lazy dog",
      200,
      32,
    );
    expect(lines.length).toBeGreaterThan(1);
  });

  it("keeps short text as one line", () => {
    const lines = wrapText("Hi", 500, 32);
    expect(lines).toHaveLength(1);
  });
});
