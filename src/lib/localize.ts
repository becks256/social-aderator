import { isMockMode } from "./openai";
import OpenAI from "openai";
import type { MarketCopy } from "./types";

const MOCK_TRANSLATIONS: Record<string, Partial<MarketCopy>> = {
  "fr-FR": {
    headline: "Votre peau. Votre été.",
    body: "Protection SPF 50 et éclat toute la journée",
    cta: "Acheter",
    disclaimer: "Testé par des dermatologues",
  },
  "de-DE": {
    headline: "Ihre Haut. Ihr Sommer.",
    body: "LSF 50 Schutz trifft ganztägigen Glanz",
    cta: "Kaufen",
  },
  "es-ES": {
    headline: "Tu piel. Tu verano.",
    body: "Protección SPF 50 con resplandor todo el día",
    cta: "Comprar",
  },
};

/**
 * Localize copy for a market.
 * Mock mode: returns hardcoded translations or prefixed source copy.
 * Live mode: calls gpt-5.4-nano via tool call to translate.
 */
export async function localizeMarketCopy(
  source: MarketCopy,
  market: string,
  brand: string,
  productName: string,
): Promise<MarketCopy> {
  if (isMockMode()) {
    const t = MOCK_TRANSLATIONS[market];
    return {
      headline: t?.headline ?? `[${market}] ${source.headline}`,
      body: t?.body ?? `[${market}] ${source.body}`,
      cta: t?.cta ?? source.cta,
      disclaimer: t?.disclaimer ?? source.disclaimer,
    };
  }

  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const prompt = `Translate the following advertising copy for ${brand}'s product "${productName}" into the ${market} locale. Preserve tone, energy, and brand voice.

Source copy:
${JSON.stringify(source, null, 2)}`;

  const response = await ai.chat.completions.create({
    model: "gpt-5.4-nano",
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        type: "function",
        function: {
          name: "submit_translation",
          description: "Submit the translated advertising copy",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string", description: "Translated headline" },
              body: { type: "string", description: "Translated body copy" },
              cta: { type: "string", description: "Translated call-to-action" },
              disclaimer: {
                type: "string",
                description: "Translated disclaimer (if present)",
              },
            },
            required: ["headline", "body", "cta"],
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "submit_translation" } },
  });

  try {
    const toolCall = response.choices[0]?.message.tool_calls?.[0];
    const args =
      toolCall && "function" in toolCall ? toolCall.function.arguments : "";
    return JSON.parse(args) as MarketCopy;
  } catch {
    return source;
  }
}
