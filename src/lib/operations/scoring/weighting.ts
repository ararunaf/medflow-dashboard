/**
 * Agregações ponderadas para scores compostos.
 */

export function weightedAverage(parts: readonly { value: number; weight: number }[]): number {
  let wsum = 0;
  let acc = 0;
  for (const p of parts) {
    const w = Number.isFinite(p.weight) && p.weight > 0 ? p.weight : 0;
    if (w === 0) continue;
    wsum += w;
    acc += p.value * w;
  }
  if (wsum === 0) return 0;
  return acc / wsum;
}
