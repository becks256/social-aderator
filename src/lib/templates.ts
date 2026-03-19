import type { AspectRatio } from "./types";

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextZone extends Zone {
  fontSize: number;
  lineHeight: number;
  color: string;
}

export interface Template {
  canvas: { width: number; height: number };
  hero: Zone;
  text: TextZone; // headline zone
  bodyText: TextZone; // body copy zone (y computed dynamically for 9:16)
  disclaimer: TextZone;
  logo: Zone;
  packshot: Zone;
  cta: Zone & { fontSize: number; color: string; bg: string; radius: number };
  safeZone?: { x: number; width: number }; // 9:16 only
}

export const TEMPLATES: Record<AspectRatio, Template> = {
  "1:1": {
    canvas: { width: 1080, height: 1080 },
    hero: { x: 0, y: 0, width: 1080, height: 648 },
    text: {
      x: 24,
      y: 660,
      width: 1032,
      height: 80,
      fontSize: 48,
      lineHeight: 56,
      color: "#111111",
    },
    bodyText: {
      x: 24,
      y: 752,
      width: 720,
      height: 60,
      fontSize: 32,
      lineHeight: 40,
      color: "#444444",
    },
    disclaimer: {
      x: 24,
      y: 820,
      width: 720,
      height: 36,
      fontSize: 22,
      lineHeight: 28,
      color: "#888888",
    },
    packshot: { x: 756, y: 810, width: 270, height: 216 },
    logo: { x: 24, y: 24, width: 180, height: 72 },
    cta: {
      x: 24,
      y: 900,
      width: 216,
      height: 54,
      fontSize: 26,
      color: "#000000",
      bg: "#f5c518",
      radius: 8,
    },
  },

  "9:16": {
    canvas: { width: 1080, height: 1920 },
    safeZone: { x: 54, width: 972 },
    hero: { x: 0, y: 0, width: 1080, height: 960 },
    text: {
      x: 54,
      y: 998,
      width: 756,
      height: 100,
      fontSize: 52,
      lineHeight: 64,
      color: "#111111",
    },
    // bodyText y is dynamic: headline y + headline bbox height + 16
    bodyText: {
      x: 54,
      y: 1118,
      width: 756,
      height: 80,
      fontSize: 36,
      lineHeight: 44,
      color: "#444444",
    },
    disclaimer: {
      x: 54,
      y: 1214,
      width: 756,
      height: 40,
      fontSize: 24,
      lineHeight: 30,
      color: "#888888",
    },
    packshot: { x: 756, y: 960, width: 270, height: 324 },
    logo: { x: 54, y: 36, width: 180, height: 72 },
    cta: {
      x: 378,
      y: 1680,
      width: 324,
      height: 72,
      fontSize: 32,
      color: "#000000",
      bg: "#f5c518",
      radius: 36,
    },
  },

  "16:9": {
    canvas: { width: 1920, height: 1080 },
    hero: { x: 0, y: 0, width: 1056, height: 1080 },
    text: {
      x: 1104,
      y: 400,
      width: 780,
      height: 100,
      fontSize: 52,
      lineHeight: 64,
      color: "#f1f5f9",
    },
    bodyText: {
      x: 1104,
      y: 520,
      width: 780,
      height: 80,
      fontSize: 32,
      lineHeight: 40,
      color: "#94a3b8",
    },
    disclaimer: {
      x: 1104,
      y: 1040,
      width: 780,
      height: 30,
      fontSize: 20,
      lineHeight: 26,
      color: "#64748b",
    },
    packshot: { x: 1500, y: 700, width: 420, height: 324 },
    logo: { x: 1780, y: 24, width: 120, height: 48 },
    cta: {
      x: 1104,
      y: 680,
      width: 240,
      height: 56,
      fontSize: 26,
      color: "#000000",
      bg: "#f5c518",
      radius: 8,
    },
  },
};
