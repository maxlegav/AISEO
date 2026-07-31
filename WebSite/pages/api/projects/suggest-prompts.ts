import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { handleApiError } from "@/lib/error-handler";
import { handleZodError } from "@/lib/validation/helpers";
import { requireWorkspace } from "@/lib/api-workspace";
import {
  suggestPrompts,
  defaultSelection,
  type PromptSuggestion,
} from "@/lib/monitoring/prompt-suggestions";
import { generateText, hasAnyKey } from "@/lib/llm/generate";

/**
 * `POST /api/projects/suggest-prompts` — the ~100 questions proposed at
 * onboarding, for the user to review and edit.
 *
 * The template generator always runs and always returns a full set, so the
 * feature works with no API key at all. When a key *is* configured, an LLM pass
 * adds queries only a human would know for that specific business (local slang,
 * category jargon, the way that audience actually phrases things) and the two
 * are merged. The LLM never replaces the templates: a provider outage must not
 * turn onboarding into an empty screen.
 */

const SuggestSchema = z.object({
  brandName: z.string().min(1).max(120),
  category: z.string().min(1).max(160),
  competitors: z.array(z.string().min(1).max(120)).max(10).default([]),
  city: z.string().max(80).optional(),
  audience: z.string().max(80).optional(),
});

/** Extra prompts from an LLM, merged on top of the templates. Never throws. */
async function llmExtras(
  input: z.infer<typeof SuggestSchema>,
  existing: PromptSuggestion[],
): Promise<PromptSuggestion[]> {
  if (!hasAnyKey()) return [];

  const system = [
    "Tu aides à construire une liste de requêtes de recherche à surveiller pour une marque.",
    "Tu écris comme les gens tapent vraiment : 3 à 5 mots, sans verbe, sans majuscule, sans ponctuation.",
    "Pas de phrases marketing, pas de belles formulations.",
    "Réponds uniquement par une requête par ligne, sans numérotation ni tiret.",
  ].join(" ");

  const user = [
    `Marque : ${input.brandName}`,
    `Catégorie : ${input.category}`,
    input.city ? `Ville : ${input.city}` : "",
    input.audience ? `Cible : ${input.audience}` : "",
    input.competitors.length ? `Concurrents : ${input.competitors.join(", ")}` : "",
    "",
    "Donne 30 requêtes supplémentaires, spécifiques à ce métier (vocabulaire du secteur,",
    "façons de dire locales, besoins concrets), différentes de celles-ci :",
    existing
      .slice(0, 40)
      .map((s) => s.text)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateText(system, user);
  if (!result.text) return [];

  return result.text
    .split("\n")
    .map((line) => line.replace(/^[\s\-*\d.)]+/, "").trim())
    .filter((line) => line.length > 2 && line.length <= 120)
    .slice(0, 30)
    .map((text) => ({
      text,
      // Short and verbless is the brief; anything longer is long-tail.
      style: text.split(" ").length <= 6 && !text.includes("?") ? "brute" : "longue",
      intent: "decouverte",
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    // Authenticated only: this can call a paid provider.
    await requireWorkspace(req, res);

    const parsed = SuggestSchema.safeParse(req.body);
    if (!parsed.success) return handleZodError(parsed.error, res);

    const base = suggestPrompts(parsed.data);
    const extras = await llmExtras(parsed.data, base);

    // Templates first — they are the reliable, deduplicated backbone.
    const seen = new Set(base.map((s) => s.text.toLowerCase()));
    const merged = [...base];
    for (const extra of extras) {
      const key = extra.text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(extra);
    }

    return res.status(200).json({
      success: true,
      data: {
        suggestions: merged,
        preselected: defaultSelection(merged, 40).map((s) => s.text),
        enrichedByLLM: extras.length > 0,
      },
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
