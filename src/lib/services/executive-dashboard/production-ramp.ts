/**
 * F6-O2 — progresso de rampa de produção: quanto do volume/faturamento real
 * do mês foco já alcança o alvo escolhido (10%/50%/100% da escala plena da
 * cooperativa). A decisão de QUANDO subir o alvo é institucional; este
 * módulo só calcula, de forma pura e testável, onde o mês foco está frente
 * ao alvo atual — nunca decide o alvo sozinho.
 */

export const PRODUCTION_RAMP_TARGET_PCTS = [10, 50, 100] as const;
export type ProductionRampTargetPct = (typeof PRODUCTION_RAMP_TARGET_PCTS)[number];

export function isProductionRampTargetPct(value: unknown): value is ProductionRampTargetPct {
  return (PRODUCTION_RAMP_TARGET_PCTS as readonly unknown[]).includes(value);
}

export type ProductionRampProgress = {
  targetPct: ProductionRampTargetPct;
  targetGuides: number;
  targetRevenueBRL: number;
  actualGuides: number;
  actualBilledBRL: number;
  /** Percentual do alvo já alcançado — pode passar de 100 (alvo superado). */
  guidesProgressPct: number;
  revenueProgressPct: number;
};

export function computeProductionRampProgress(input: {
  targetPct: ProductionRampTargetPct;
  fullScaleGuidesPerMonth: number;
  fullScaleRevenuePerMonthBRL: number;
  actualGuides: number;
  actualBilledBRL: number;
}): ProductionRampProgress {
  const targetGuides = Math.round((input.fullScaleGuidesPerMonth * input.targetPct) / 100);
  const targetRevenueBRL =
    Math.round(((input.fullScaleRevenuePerMonthBRL * input.targetPct) / 100) * 100) / 100;
  const guidesProgressPct =
    targetGuides > 0 ? Math.round((input.actualGuides / targetGuides) * 1000) / 10 : 0;
  const revenueProgressPct =
    targetRevenueBRL > 0 ? Math.round((input.actualBilledBRL / targetRevenueBRL) * 1000) / 10 : 0;

  return {
    targetPct: input.targetPct,
    targetGuides,
    targetRevenueBRL,
    actualGuides: input.actualGuides,
    actualBilledBRL: input.actualBilledBRL,
    guidesProgressPct,
    revenueProgressPct,
  };
}
