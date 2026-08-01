/**
 * Regras — Assinaturas
 */
import type { AuditRule } from "../types/audit-rule";
import { makeFinding } from "./rule-helpers";

const SIGNATURE_FIELDS = [
  { code: "beneficiary_signature", label: "Assinatura do beneficiário" },
  { code: "professional_signature", label: "Assinatura do profissional" },
  { code: "provider_signature", label: "Assinatura do prestador" },
] as const;

export const ASS_001: AuditRule = {
  id: "ASS-001",
  name: "Assinatura do beneficiário ausente",
  description: "Assinatura do beneficiário pode ser exigida pela operadora.",
  category: "assinaturas",
  severity: "medio",
  blocking: false,
  field: "beneficiary_signature",
  message: "Assinatura do beneficiário não identificada.",
  suggestedCorrection: "Capture a assinatura do beneficiário na guia.",
  evaluate: (ctx) => {
    const field = ctx.getField("beneficiary_signature");
    if (!field) return null;
    if (field.status === "missing" || field.value == null) {
      return makeFinding(ASS_001, ctx, { detectedValue: null });
    }
    return null;
  },
};

export const ASS_002: AuditRule = {
  id: "ASS-002",
  name: "Assinatura do profissional ausente",
  description: "Assinatura/carimbo do profissional executante é frequentemente exigida.",
  category: "assinaturas",
  severity: "alto",
  blocking: false,
  field: "professional_signature",
  message: "Assinatura do profissional executante não identificada.",
  suggestedCorrection: "Verifique a assinatura ou carimbo do profissional na guia.",
  evaluate: (ctx) => {
    const field = ctx.getField("professional_signature");
    if (!field) return null;
    if (field.status === "missing" || field.value == null) {
      return makeFinding(ASS_002, ctx, { detectedValue: null });
    }
    return null;
  },
};

export const ASS_003: AuditRule = {
  id: "ASS-003",
  name: "Assinaturas do grupo ausentes",
  description: "Campos de assinatura marcados como ausentes pelo parser.",
  category: "assinaturas",
  severity: "baixo",
  blocking: false,
  field: "provider_signature",
  message: "Um ou mais campos de assinatura estão ausentes na guia.",
  suggestedCorrection: "Verifique as assinaturas obrigatórias conforme operadora.",
  evaluate: (ctx) => {
    const assinaturaFields = ctx.guide.groups.assinaturas ?? [];
    const missing = assinaturaFields.filter((f) => f.status === "missing" || f.value == null);
    if (missing.length > 0) {
      return makeFinding(ASS_003, ctx, {
        field: missing[0]!.code,
        detectedValue: null,
        message: `Assinatura ausente: ${missing.map((f) => f.label).join(", ")}.`,
      });
    }
    for (const sig of SIGNATURE_FIELDS) {
      const field = ctx.getField(sig.code);
      if (field && (field.status === "missing" || field.value == null)) {
        return makeFinding(ASS_003, ctx, {
          field: sig.code,
          detectedValue: null,
          message: `${sig.label} ausente.`,
        });
      }
    }
    return null;
  },
};

export const ASSINATURAS_RULES: AuditRule[] = [ASS_001, ASS_002, ASS_003];
