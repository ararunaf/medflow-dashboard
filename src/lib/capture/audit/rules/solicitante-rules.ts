/**
 * Regras — Solicitante
 */
import { normalizeCrm } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const SOL_001: AuditRule = {
  id: "SOL-001",
  name: "CRM solicitante obrigatório (SADT)",
  description: "Guia SP/SADT exige CRM do médico solicitante.",
  category: "solicitante",
  severity: "alto",
  blocking: false,
  field: "requesting_crm",
  message: "CRM do médico solicitante não informado.",
  suggestedCorrection: "Informe o CRM e UF do médico solicitante.",
  evaluate: (ctx) => {
    if (!ctx.isGuideType("guia_sadt")) return null;
    return ctx.isMissing("requesting_crm") ? missingFieldFinding(SOL_001, ctx) : null;
  },
};

export const SOL_002: AuditRule = {
  id: "SOL-002",
  name: "CRM solicitante inválido",
  description: "CRM do solicitante deve estar no formato UF-NNNNNN.",
  category: "solicitante",
  severity: "alto",
  blocking: false,
  field: "requesting_crm",
  message: (ctx) => `CRM solicitante inválido: "${ctx.getValue("requesting_crm") ?? ""}".`,
  suggestedCorrection: "Corrija o CRM do solicitante (ex.: SP-123456).",
  evaluate: (ctx) => {
    if (!ctx.isGuideType("guia_sadt")) return null;
    const raw = ctx.getField("requesting_crm")?.rawValue ?? ctx.getValue("requesting_crm");
    if (!raw || ctx.isMissing("requesting_crm")) return null;
    if (normalizeCrm(raw) == null) {
      return invalidFormatFinding(SOL_002, ctx, raw, "CRM no formato UF-NNNNNN");
    }
    return null;
  },
};

export const SOLICITANTE_RULES: AuditRule[] = [SOL_001, SOL_002];
