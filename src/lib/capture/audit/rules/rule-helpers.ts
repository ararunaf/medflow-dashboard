/**
 * Helpers para construção de findings em regras.
 */
import type { AuditFinding } from "../types/audit-finding";
import type { AuditRule } from "../types/audit-rule";
import { fieldConfidence, type AuditRuleContext } from "../engine/audit-context";

export function makeFinding(
  rule: AuditRule,
  ctx: AuditRuleContext,
  overrides: Partial<Omit<AuditFinding, "ruleId" | "category" | "status">> = {},
): Omit<AuditFinding, "id"> {
  return {
    ruleId: rule.id,
    category: rule.category,
    field: overrides.field ?? rule.field,
    severity: overrides.severity ?? rule.severity,
    status: "open",
    message: overrides.message ?? (typeof rule.message === "function" ? rule.message(ctx) : rule.message),
    detectedValue: overrides.detectedValue ?? ctx.getValue(rule.field),
    expectedValue: overrides.expectedValue ?? null,
    confidence: overrides.confidence ?? fieldConfidence(ctx, overrides.field ?? rule.field),
    suggestedCorrection: overrides.suggestedCorrection ?? rule.suggestedCorrection,
    blocking: overrides.blocking ?? rule.blocking,
  };
}

export function missingFieldFinding(rule: AuditRule, ctx: AuditRuleContext, field?: string): Omit<AuditFinding, "id"> {
  const code = field ?? rule.field;
  return makeFinding(rule, ctx, {
    field: code,
    detectedValue: null,
    message: typeof rule.message === "function" ? rule.message(ctx) : rule.message,
    confidence: fieldConfidence(ctx, code),
  });
}

export function invalidFormatFinding(
  rule: AuditRule,
  ctx: AuditRuleContext,
  detected: string | null,
  expected: string,
  field?: string,
): Omit<AuditFinding, "id"> {
  return makeFinding(rule, ctx, {
    field: field ?? rule.field,
    detectedValue: detected,
    expectedValue: expected,
    confidence: fieldConfidence(ctx, field ?? rule.field),
  });
}
