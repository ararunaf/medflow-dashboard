/**
 * Normalização determinística para compor scores sem reprocessar séries grandes.
 */

export function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/** Mapeia [lo, hi] → [0, 1]; fora do intervalo satura. */
export function linearUnit(n: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  return clamp((n - lo) / (hi - lo), 0, 1);
}

/** Converte unidade 0–1 para 0–100 inteiro com 1 casa quando necessário no caller. */
export function unitToScore(u: number): number {
  return Math.round(clamp(u, 0, 1) * 1000) / 10;
}

export function invertUnit(u: number): number {
  return clamp(1 - u, 0, 1);
}
