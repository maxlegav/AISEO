// ─── Shared helpers & constants for audit components ─────────────────────────

import type { HtmlScanRecord } from "./auditTypes";

export function scoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function scoreLabel(score: number): string {
  if (score >= 70) return "GOOD";
  if (score >= 40) return "MODERATE";
  return "CRITICAL";
}

export function scoreTextClass(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function scoreBarClass(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function pct(val: number): number {
  return Math.round(val * 100);
}

export function getBool(obj: HtmlScanRecord | undefined, key: string): boolean | undefined {
  const val = obj?.[key];
  return typeof val === "boolean" ? val : undefined;
}

export function getString(obj: HtmlScanRecord | undefined, key: string): string | undefined {
  const val = obj?.[key];
  return typeof val === "string" ? val : undefined;
}

export function getNumber(obj: HtmlScanRecord | undefined, key: string): number | undefined {
  const val = obj?.[key];
  return typeof val === "number" ? val : undefined;
}

export const CATEGORY_META: Record<string, { label: string; bar: string; pill: string }> = {
  discovery:   { label: "Discovery",   bar: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  comparison:  { label: "Comparison",  bar: "bg-purple-500",  pill: "bg-purple-50 text-purple-700" },
  reputation:  { label: "Reputation",  bar: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  product:     { label: "Product",     bar: "bg-teal-500",    pill: "bg-teal-50 text-teal-700" },
  alternative: { label: "Alternative", bar: "bg-orange-500",  pill: "bg-orange-50 text-orange-700" },
  trust:       { label: "Trust",       bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
};

export const LEVEL_COLORS = [
  "bg-emerald-500", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500",
];
export const LEVEL_TEXT = [
  "text-emerald-600", "text-green-600", "text-yellow-600", "text-orange-600", "text-red-600",
];
export const LEVEL_LABELS: Record<number, string> = {
  1: "Broad queries",
  2: "Niche market",
  3: "Descriptive",
  4: "Very specific",
  5: "By name only",
};

export const ENGINE_ABBR: Record<string, string> = {
  chatgpt:    "GPT",
  claude:     "CLN",
  perplexity: "PPX",
  gemini:     "GEM",
};
