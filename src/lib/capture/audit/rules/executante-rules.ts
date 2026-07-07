/**
 * Regras — Executante
 */
import { normalizeCrm, normalizeCro } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const EXE_001: AuditRule = {
  id: "EXE-001",
  name: "CRM executante obrigatório",
  description: "CRM do profissional executante é obrigatório — glosa ANS 2603 frequente.",
  category: "executante",
  severity: "alto",
  blocking: false,
  field: "executing_crm",
  message: "CRM do profissional executante não informado.",
  suggestedCorrection: "Informe o CRM e UF do profissional executante.",
  evaluate: (ctx) => (ctx.isMissing("executing_crm") ? missingFieldFinding(EXE_001, ctx) : null),
};

export const EXE_002: AuditRule = {
  id: "EXE-002",
  name: "CRM executante inválido",
  description: "CRM deve estar no formato UF-NNNNNN ou equivalente normalizado.",
  category: "executante",
  severity: "alto",
  blocking: false,
  field: "executing_crm",
  message: (ctx) => `CRM executante inválido: "${ctx.getValue("executing_crm") ?? ""}".`,
  suggestedCorrection: "Corrija o CRM do executante (ex.: SP-123456).",
  evaluate: (ctx) => {
    const raw = ctx.getField("executing_crm")?.rawValue ?? ctx.getValue("executing_crm");
    if (!raw || ctx.isMissing("executing_crm")) return null;
    if (normalizeCrm(raw) == null) {
      return invalidFormatFinding(EXE_002, ctx, raw, "CRM no formato UF-NNNNNN");
    }
    return null;
  },
};

export const EXE_003: AuditRule = {
  id: "EXE-003",
  name: "CRO executante inválido",
  description: "CRO informado deve estar no formato UF-NNNNNN.",
  category: "executante",
  severity: "medio",
  blocking: false,
  field: "executing_cro",
  message: (ctx) => `CRO executante inválido: "${ctx.getValue("executing_cro") ?? ""}".`,
  suggestedCorrection: "Corrija o CRO do executante (ex.: SP-123456).",
  evaluate: (ctx) => {
    const field = ctx.getField("executing_cro");
    if (!field || field.status === "missing") return null;
    const raw = field.rawValue ?? field.value;
    if (!raw) return null;
    if (normalizeCro(raw) == null) {
      return invalidFormatFinding(EXE_003, ctx, raw, "CRO no formato UF-NNNNNN", "executing_cro");
    }
    return null;
  },
};

export const EXECUTANTE_RULES: AuditRule[] = [EXE_001, EXE_002, EXE_003];
