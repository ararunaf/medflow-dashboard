/**
 * Contexto de avaliação de regras — construído a partir do StructuredGuide.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { StructuredField, StructuredGuide } from "../../parser/types/structured-guide";
import {
  recognizeExecutingProfessional,
  type ExecutingProfessionalRecognition,
  type TenantProfessional,
} from "../data/tenant-professionals";

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
  /** Executante lido na guia × cadastro da instituição ("unavailable" sem cadastro carregado). */
  executingProfessional: ExecutingProfessionalRecognition;
};

export function buildAuditContext(
  guide: StructuredGuide,
  options: {
    sessionId?: string;
    /** Cadastro de profissionais do tenant; ausente = regras de cadastro não avaliam. */
    tenantProfessionals?: readonly TenantProfessional[];
  } = {},
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

  const isGuideType = (...types: StructuredGuide["guideType"][]) => types.includes(guide.guideType);

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

  const executingProfessional = recognizeExecutingProfessional(options.tenantProfessionals, {
    crm: isPresent("executing_crm")
      ? (getField("executing_crm")?.rawValue ?? getValue("executing_crm"))
      : null,
    name:
      isPresent("executing_name") && !/\d/.test(getValue("executing_name") ?? "")
        ? getValue("executing_name")
        : null,
  });

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
    executingProfessional,
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
