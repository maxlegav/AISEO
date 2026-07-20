/**
 * ISO-8601 week helpers. Weeks are keyed as "YYYY-Www" (e.g. "2026-W29") so
 * WeeklyScore documents sort lexicographically in chronological order.
 */

export function isoWeek(date: Date = new Date()): string {
  // Copy so we don't mutate the caller's date.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday of the current week decides the year (ISO rule).
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Next run timestamp given a frequency, from `from`. */
export function nextRunDate(frequency: "weekly" | "daily", from: Date = new Date()): Date {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + (frequency === "daily" ? 1 : 7));
  return next;
}
