/**
 * Regras — Diagnóstico / CID
 */
import { normalizeCid } from "../../parser/normalizers";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding } from "./rule-helpers";

export const DIA_001: AuditRule = {
  id: "DIA-001",
  name: "CID ausente",
  description: "CID-10 não informado — pode gerar glosa em operadoras que exigem.",
  category: "diagnostico",
  severity: "medio",
  blocking: false,
  field: "cid_code",
  message: "CID-10 não informado na guia.",
  suggestedCorrection: "Informe o CID-10 correspondente ao diagnóstico.",
  evaluate: (ctx) => {
    if (ctx.isGuideType("guia_honorario")) return null;
    return ctx.isMissing("cid_code") ? missingFieldFinding(DIA_001, ctx) : null;
  },
};

export const DIA_002: AuditRule = {
  id: "DIA-002",
  name: "CID inválido",
  description: "CID-10 deve seguir o padrão letra + 2 dígitos (+ subcategoria opcional).",
  category: "diagnostico",
  severity: "alto",
  blocking: false,
  field: "cid_code",
  message: (ctx) => `CID-10 inválido: "${ctx.getValue("cid_code") ?? ""}".`,
  suggestedCorrection: "Corrija o CID-10 (ex.: J06.9, K80.2).",
  evaluate: (ctx) => {
    const raw = ctx.getField("cid_code")?.rawValue ?? ctx.getValue("cid_code");
    if (!raw || ctx.isMissing("cid_code")) return null;
    if (normalizeCid(raw) == null) {
      return invalidFormatFinding(DIA_002, ctx, raw, "CID-10 válido (ex.: J06.9)");
    }
    return null;
  },
};

export const DIAGNOSTICO_RULES: AuditRule[] = [DIA_001, DIA_002];
