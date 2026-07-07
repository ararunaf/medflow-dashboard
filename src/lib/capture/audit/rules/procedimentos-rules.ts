/**
 * Regras — Procedimentos / TUSS
 */
import { normalizeTuss } from "../../parser/normalizers";
import { isTussInCatalog } from "../data/tuss-catalog";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding, makeFinding } from "./rule-helpers";

export const PRC_001: AuditRule = {
  id: "PRC-001",
  name: "Código TUSS obrigatório",
  description: "Pelo menos um código TUSS deve estar presente na guia.",
  category: "procedimentos",
  severity: "critico",
  blocking: true,
  field: "procedure_code",
  message: "Código TUSS do procedimento não informado.",
  suggestedCorrection: "Informe o código TUSS do procedimento realizado.",
  evaluate: (ctx) => {
    const codes = ctx.allProcedureCodes();
    if (codes.length === 0) return missingFieldFinding(PRC_001, ctx);
    return null;
  },
};

export const PRC_002: AuditRule = {
  id: "PRC-002",
  name: "Formato TUSS inválido",
  description: "Código TUSS deve conter 6–8 dígitos numéricos.",
  category: "procedimentos",
  severity: "alto",
  blocking: false,
  field: "procedure_code",
  message: (ctx) => {
    const codes = ctx.allProcedureCodes();
    const invalid = codes.find((c) => normalizeTuss(c) == null);
    return `Código TUSS inválido: "${invalid ?? ""}".`;
  },
  suggestedCorrection: "Corrija o código TUSS (6–8 dígitos numéricos).",
  evaluate: (ctx) => {
    for (const code of ctx.allProcedureCodes()) {
      const raw = code;
      if (normalizeTuss(raw) == null) {
        return invalidFormatFinding(PRC_002, ctx, raw, "TUSS com 6–8 dígitos", "procedure_code");
      }
    }
    return null;
  },
};

export const PRC_003: AuditRule = {
  id: "PRC-003",
  name: "TUSS fora do catálogo",
  description: "Código TUSS deve existir no catálogo ANS/TUSS ativo.",
  category: "procedimentos",
  severity: "alto",
  blocking: false,
  field: "procedure_code",
  message: (ctx) => {
    const invalid = ctx.allProcedureCodes().find((c) => !isTussInCatalog(c));
    return `Código TUSS ${invalid ?? ""} não encontrado no catálogo.`;
  },
  suggestedCorrection: "Selecione um procedimento válido do catálogo TUSS.",
  evaluate: (ctx) => {
    for (const code of ctx.allProcedureCodes()) {
      if (!isTussInCatalog(code)) {
        return makeFinding(PRC_003, ctx, {
          detectedValue: code,
          expectedValue: "Código TUSS ativo no catálogo",
          field: "procedure_code",
        });
      }
    }
    return null;
  },
};

export const PRC_004: AuditRule = {
  id: "PRC-004",
  name: "Valor total ausente",
  description: "Valor total do procedimento deve ser informado.",
  category: "procedimentos",
  severity: "medio",
  blocking: false,
  field: "total_value",
  message: "Valor total do procedimento não informado.",
  suggestedCorrection: "Informe o valor total da guia.",
  evaluate: (ctx) => (ctx.isMissing("total_value") ? missingFieldFinding(PRC_004, ctx) : null),
};

export const PROCEDIMENTOS_RULES: AuditRule[] = [PRC_001, PRC_002, PRC_003, PRC_004];
