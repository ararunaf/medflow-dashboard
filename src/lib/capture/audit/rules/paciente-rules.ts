/**
 * Regras — Paciente
 */
import { normalizeCpf } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import type { AuditRuleContext } from "../engine/audit-context";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const PAT_001: AuditRule = {
  id: "PAT-001",
  name: "Nome do beneficiário obrigatório",
  description: "Nome do beneficiário é obrigatório para faturamento TISS.",
  category: "paciente",
  severity: "critico",
  blocking: true,
  field: "beneficiary_name",
  message: "Nome do beneficiário não informado.",
  suggestedCorrection: "Informe o nome completo do beneficiário conforme a carteirinha.",
  evaluate: (ctx) => (ctx.isMissing("beneficiary_name") ? missingFieldFinding(PAT_001, ctx) : null),
};

export const PAT_002: AuditRule = {
  id: "PAT-002",
  name: "Carteirinha obrigatória",
  description: "Número da carteirinha é necessário para identificação do beneficiário.",
  category: "paciente",
  severity: "alto",
  blocking: false,
  field: "beneficiary_card_number",
  message: "Número da carteirinha não informado.",
  suggestedCorrection: "Informe o número da carteirinha do beneficiário.",
  evaluate: (ctx) =>
    ctx.isMissing("beneficiary_card_number") ? missingFieldFinding(PAT_002, ctx) : null,
};

export const PAT_003: AuditRule = {
  id: "PAT-003",
  name: "CPF inválido",
  description: "CPF informado deve ter formato válido (11 dígitos).",
  category: "paciente",
  severity: "medio",
  blocking: false,
  field: "beneficiary_cpf",
  message: (ctx) => `CPF inválido: "${ctx.getValue("beneficiary_cpf") ?? ""}".`,
  suggestedCorrection: "Corrija o CPF do beneficiário (11 dígitos).",
  evaluate: (ctx) => {
    const raw = ctx.getField("beneficiary_cpf")?.rawValue ?? ctx.getValue("beneficiary_cpf");
    if (!raw || ctx.isMissing("beneficiary_cpf")) return null;
    if (normalizeCpf(raw) == null) {
      return invalidFormatFinding(PAT_003, ctx, raw, "CPF com 11 dígitos");
    }
    return null;
  },
};

export const PAT_004: AuditRule = {
  id: "PAT-004",
  name: "Identificador do beneficiário ausente",
  description: "Pelo menos carteirinha ou CPF deve estar presente.",
  category: "paciente",
  severity: "critico",
  blocking: true,
  field: "beneficiary_card_number",
  message: "Nenhum identificador do beneficiário (carteirinha ou CPF) informado.",
  suggestedCorrection: "Informe a carteirinha ou o CPF do beneficiário.",
  evaluate: (ctx) => {
    if (ctx.isMissing("beneficiary_card_number") && ctx.isMissing("beneficiary_cpf")) {
      return missingFieldFinding(PAT_004, ctx);
    }
    return null;
  },
};

export const PACIENTE_RULES: AuditRule[] = [PAT_001, PAT_002, PAT_003, PAT_004];
