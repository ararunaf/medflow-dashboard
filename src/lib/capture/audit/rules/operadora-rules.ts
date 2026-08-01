/**
 * Regras — Operadora
 */
import { normalizeAnsCode } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const OPR_001: AuditRule = {
  id: "OPR-001",
  name: "Registro ANS obrigatório",
  description: "Código de registro ANS da operadora é obrigatório.",
  category: "operadora",
  severity: "critico",
  blocking: true,
  field: "operator_ans_code",
  message: "Registro ANS da operadora não informado.",
  suggestedCorrection: "Informe o registro ANS da operadora (6 dígitos).",
  evaluate: (ctx) =>
    ctx.isMissing("operator_ans_code") ? missingFieldFinding(OPR_001, ctx) : null,
};

export const OPR_002: AuditRule = {
  id: "OPR-002",
  name: "Registro ANS inválido",
  description: "Registro ANS deve conter exatamente 6 dígitos.",
  category: "operadora",
  severity: "alto",
  blocking: false,
  field: "operator_ans_code",
  message: (ctx) => `Registro ANS inválido: "${ctx.getValue("operator_ans_code") ?? ""}".`,
  suggestedCorrection: "Corrija o registro ANS para 6 dígitos numéricos.",
  evaluate: (ctx) => {
    const raw = ctx.getField("operator_ans_code")?.rawValue ?? ctx.getValue("operator_ans_code");
    if (!raw || ctx.isMissing("operator_ans_code")) return null;
    if (normalizeAnsCode(raw) == null) {
      return invalidFormatFinding(OPR_002, ctx, raw, "Registro ANS com 6 dígitos");
    }
    return null;
  },
};

export const OPERADORA_RULES: AuditRule[] = [OPR_001, OPR_002];
