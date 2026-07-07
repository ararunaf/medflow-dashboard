/**
 * Contexto de avaliação de regras — construído a partir do StructuredGuide.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { StructuredField, StructuredGuide } from "../../parser/types/structured-guide";

export type AuditRuleContext = {
  guide: StructuredGuide;
  sessionId?: string;
  evaluatedAt: string;
  getField: (code: string) => StructuredField | undefined;
  getValue: (code: string) => string | null;
  isMissing: (code: string) => boolean;
  isPresent: (code: string) => boolean;
  isGuideType: (...types: StructuredGuide["guideType"][]) => boolean;
  allProcedureCodes: () => string[];
};

export function buildAuditContext(
  guide: StructuredGuide,
  options: { sessionId?: string } = {},
): AuditRuleContext {
  const getField = (code: string) => guide.fields[code];

  const getValue = (code: string): string | null => {
    const field = getField(code);
    return field?.value ?? null;
  };

  const isMissing = (code: string): boolean => {
    const field = getField(code);
    if (!field) return true;
    return field.status === "missing" || field.value == null || field.value.trim() === "";
  };

  const isPresent = (code: string): boolean => !isMissing(code);

  const isGuideType = (...types: StructuredGuide["guideType"][]) =>
    types.includes(guide.guideType);

  const allProcedureCodes = (): string[] => {
    const codes: string[] = [];
    if (isPresent("procedure_code")) {
      const v = getValue("procedure_code");
      if (v) codes.push(v);
    }
    for (const line of guide.procedures) {
      const code = line.fields.procedure_code?.value;
      if (code) codes.push(code);
    }
    return [...new Set(codes)];
  };

  return {
    guide,
    sessionId: options.sessionId,
    evaluatedAt: new Date().toISOString(),
    getField,
    getValue,
    isMissing,
    isPresent,
    isGuideType,
    allProcedureCodes,
  };
}

export function fieldConfidence(ctx: AuditRuleContext, code: string): number {
  return ctx.getField(code)?.confidence ?? 0;
}

export function resolveMessage(
  message: string | ((ctx: AuditRuleContext) => string),
  ctx: AuditRuleContext,
): string {
  return typeof message === "function" ? message(ctx) : message;
}
