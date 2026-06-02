/**
 * Limites de adaptação (governance boundaries) — evita repriorização excessiva,
 * loops adaptativos e weighting circular. São defaults explícitos; podem ser
 * sobrescritos por política futura sem alterar o motor.
 */
import type { AdaptationBoundaries } from "./types";

export const DEFAULT_ADAPTATION_BOUNDARIES: AdaptationBoundaries = {
  minWeight: 0.65,
  maxWeight: 1.35,
  maxAdjustmentsPerCycle: 12,
  /** Janela mínima entre eventos de governança que afetam o mesmo ajuste. */
  freezeWindowMs: 5 * 60 * 1000,
  minSampleSizeForAdaptation: 4,
};

export function clampWeight(value: number, b: AdaptationBoundaries): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(b.maxWeight, Math.max(b.minWeight, value));
}

export function clampNudge(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(-1, value));
}

/**
 * Indica se um sinal deve influenciar o peso ou se devemos manter estado static
 * por falta de amostra mínima. Bloqueia adaptações precoces.
 */
export function hasEnoughSample(sampleSize: number, b: AdaptationBoundaries): boolean {
  return sampleSize >= b.minSampleSizeForAdaptation;
}
