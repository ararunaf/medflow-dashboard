/**
 * Adaptadores de tendência: buckets diários/semanais e comparação entre períodos.
 * Funções puras — sem I/O.
 */

export type NumericTrendPoint = { key: string; value: number };

export function utcDayKey(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.slice(0, 10);
  return new Date(t).toISOString().slice(0, 10);
}

export function addUtcDays(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const t = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + delta);
  return new Date(t).toISOString().slice(0, 10);
}

/** Gera chaves YYYY-MM-DD em [fromKey, toKey) — limites em UTC. */
export function utcDayKeysBetween(fromKey: string, toKey: string, maxDays = 120): string[] {
  const out: string[] = [];
  let k = fromKey;
  let guard = 0;
  while (k < toKey && guard++ < maxDays) {
    out.push(k);
    k = addUtcDays(k, 1);
  }
  return out;
}

export function isoWeekKeyFromDay(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const dayNr = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function groupSumByWeek(points: { dayKey: string; value: number }[]): NumericTrendPoint[] {
  const m = new Map<string, number>();
  for (const p of points) {
    const wk = isoWeekKeyFromDay(p.dayKey);
    m.set(wk, (m.get(wk) ?? 0) + p.value);
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
}

export function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function lastN<T>(arr: readonly T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  return arr.slice(arr.length - n);
}
