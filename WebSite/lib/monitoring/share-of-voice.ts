/**
 * Share of voice: the slice of the category's visibility the brand holds.
 *
 * A presence rate answers "how often am I cited?". On its own it is hard to act
 * on — 45 % sounds mediocre until you learn every competitor sits at 20 %.
 * Share of voice reframes the same measurement competitively: of all the brand
 * mentions the engines made on *your* prompts, what proportion were you.
 *
 * It needs no external data — presence rates for the brand and its competitors
 * are already computed for the comparison table — which is why it is the first
 * business-facing metric worth adding.
 *
 * Reading it: with N tracked brands, 1/N is parity. Above that you are taking
 * more than your seat; below, someone else is answering in your place.
 */
import { LLM_ORDER, ENGINE_WEIGHTS, type LLMId } from "./types";

/** One brand's presence rate per engine, as shown in the comparison table. */
export interface VoiceInput {
  name: string;
  isYou?: boolean;
  scores: Record<LLMId, number>;
}

export interface ShareOfVoice {
  /** The brand's share, 0-100, weighted across engines. */
  overall: number;
  /** Share per engine, 0-100. */
  byEngine: Record<LLMId, number>;
  /** Share for every tracked brand, best first — the category split. */
  ranking: { name: string; isYou: boolean; share: number }[];
  /** Even split for the number of brands tracked: the parity line. */
  parity: number;
  /** Rank of the monitored brand, 1-based. */
  position: number;
  /** Points separating the brand from the leader (0 when it leads). */
  gapToLeader: number;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Compute share of voice from the per-engine presence rates of every tracked
 * brand. `engines` restricts the computation to the engines actually evaluated,
 * so a project tracking three engines is not diluted by the two it ignores.
 */
export function computeShareOfVoice(
  brands: VoiceInput[],
  engines: LLMId[] = LLM_ORDER,
): ShareOfVoice {
  const empty: ShareOfVoice = {
    overall: 0,
    byEngine: Object.fromEntries(LLM_ORDER.map((e) => [e, 0])) as Record<LLMId, number>,
    ranking: [],
    parity: 0,
    position: 0,
    gapToLeader: 0,
  };
  if (brands.length === 0 || engines.length === 0) return empty;

  const byEngine = {} as Record<LLMId, number>;
  for (const engine of LLM_ORDER) byEngine[engine] = 0;

  // Per engine, each brand's share of the total presence on that engine.
  const sharePerBrandEngine = new Map<string, Record<LLMId, number>>();
  for (const b of brands) sharePerBrandEngine.set(b.name, { ...byEngine });

  for (const engine of engines) {
    const total = brands.reduce((acc, b) => acc + (b.scores[engine] ?? 0), 0);
    for (const b of brands) {
      const share = total === 0 ? 0 : ((b.scores[engine] ?? 0) / total) * 100;
      const row = sharePerBrandEngine.get(b.name);
      if (row) row[engine] = share;
    }
  }

  // Roll engines up with the same weighting as the global score, so share of
  // voice and visibility score never tell contradictory stories.
  const totalWeight = engines.reduce((acc, e) => acc + ENGINE_WEIGHTS[e], 0);
  const overallFor = (name: string): number => {
    const row = sharePerBrandEngine.get(name);
    if (!row || totalWeight === 0) return 0;
    return engines.reduce((acc, e) => acc + row[e] * ENGINE_WEIGHTS[e], 0) / totalWeight;
  };

  const ranking = brands
    .map((b) => ({ name: b.name, isYou: Boolean(b.isYou), share: round(overallFor(b.name)) }))
    .sort((a, b) => b.share - a.share);

  const you = brands.find((b) => b.isYou);
  const yourRow = you ? sharePerBrandEngine.get(you.name) : undefined;
  for (const engine of LLM_ORDER) {
    byEngine[engine] = yourRow ? round(yourRow[engine]) : 0;
  }

  const overall = you ? round(overallFor(you.name)) : 0;
  const position = you ? ranking.findIndex((r) => r.isYou) + 1 : 0;
  const leader = ranking[0]?.share ?? 0;

  return {
    overall,
    byEngine,
    ranking,
    parity: round(100 / brands.length),
    position,
    gapToLeader: position === 1 ? 0 : round(leader - overall),
  };
}
