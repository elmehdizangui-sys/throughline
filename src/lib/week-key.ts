/**
 * Returns a "YYYY-WXX" week key for the given date.
 * Jan 1 is always W01; weeks never cross year boundaries.
 * This is intentionally NOT ISO 8601 — it is the canonical
 * key format for throughline_commitments and must not diverge
 * between client and server.
 */
export function getWeekKey(date = new Date()): string {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((dayOfYear + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Returns just the "WXX" label portion — for display and minimap bucketing. */
export function getWeekLabel(date = new Date()): string {
  return getWeekKey(date).split("-")[1]!;
}
