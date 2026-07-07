/**
 * Regras — Prestador
 */
import { normalizeCnpj } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const PRV_001: AuditRule = {
  id: "PRV-001",
  name: "CNPJ contratado obrigatório",
  description: "CNPJ do prestador contratado é obrigatório em guias TISS.",
  category: "prestador",
  severity: "alto",
  blocking: false,
  field: "provider_cnpj",
  message: "CNPJ do prestador contratado não informado.",
  suggestedCorrection: "Informe o CNPJ do prestador contratado.",
  evaluate: (ctx) => (ctx.isMissing("provider_cnpj") ? missingFieldFinding(PRV_001, ctx) : null),
};

export const PRV_002: AuditRule = {
  id: "PRV-002",
  name: "CNPJ inválido",
  description: "CNPJ deve conter 14 dígitos válidos.",
  category: "prestador",
  severity: "alto",
  blocking: false,
  field: "provider_cnpj",
  message: (ctx) => `CNPJ inválido: "${ctx.getValue("provider_cnpj") ?? ""}".`,
  suggestedCorrection: "Corrija o CNPJ do prestador (14 dígitos).",
  evaluate: (ctx) => {
    const raw = ctx.getField("provider_cnpj")?.rawValue ?? ctx.getValue("provider_cnpj");
    if (!raw || ctx.isMissing("provider_cnpj")) return null;
    if (normalizeCnpj(raw) == null) {
      return invalidFormatFinding(PRV_002, ctx, raw, "CNPJ com 14 dígitos");
    }
    return null;
  },
};

export const PRESTADOR_RULES: AuditRule[] = [PRV_001, PRV_002];
