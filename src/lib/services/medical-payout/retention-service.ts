import type { PayoutRuleRow } from "./types";

const REPASSE_TYPES = new Set(["percentage", "fixed", "operational_discount"]);
const RETENTION_TYPES = new Set(["retention_percentage", "retention_fixed"]);

export function isRepasseRuleType(t: string): boolean {
  return REPASSE_TYPES.has(t);
}

export function isRetentionRuleType(t: string): boolean {
  return RETENTION_TYPES.has(t);
}

function ruleSpecificity(rule: PayoutRuleRow, professionalId: string): number {
  let s = 0;
  if (rule.professional_id) {
    if (rule.professional_id !== professionalId) return -1;
    s += 100;
  }
  return s;
}

/**
 * Retenções básicas sobre o total já calculado de repasse (pós-regra por guia).
 * Percentual: melhor regra ativa por especificidade; fixas: soma das regras aplicáveis.
 */
export function computeRetentionValue(
  sumCalculatedRepasse: number,
  rules: PayoutRuleRow[],
  professionalId: string,
): number {
  const active = rules.filter((r) => r.active && isRetentionRuleType(r.payout_type));
  if (active.length === 0 || sumCalculatedRepasse <= 0) return 0;

  let pct = 0;
  let best = -1;
  for (const r of active) {
    if (r.payout_type !== "retention_percentage") continue;
    const sp = ruleSpecificity(r, professionalId);
    if (sp < 0) continue;
    const p = Number(r.payout_percentage ?? 0);
    if (sp > best) {
      best = sp;
      pct = p;
    }
  }

  const fromPct = (sumCalculatedRepasse * pct) / 100;

  let fixedSum = 0;
  for (const r of active) {
    if (r.payout_type !== "retention_fixed") continue;
    if (ruleSpecificity(r, professionalId) < 0) continue;
    fixedSum += Number(r.fixed_value ?? 0);
  }

  const total = fromPct + fixedSum;
  return Math.min(sumCalculatedRepasse, Math.max(0, Math.round(total * 100) / 100));
}
