/**
 * Regras — Diagnóstico / CID
 */
import { normalizeCid } from "../../parser/normalizers";
import { isCidInCatalog } from "../data/cid-catalog";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding, invalidFormatFinding, makeFinding } from "./rule-helpers";

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

/**
 * Não bloqueante por padrão (blocking: false) — o catálogo real de CID-10 está
 * em rollout gradual (TISS-02-DATA, modo sombra). Promover para blocking:true
 * só depois de confirmar taxa de falso-positivo baixa com o catálogo completo.
 */
export const DIA_003: AuditRule = {
  id: "DIA-003",
  name: "CID fora do catálogo",
  description: "Código CID-10 deve existir na tabela CID-10 ativa.",
  category: "diagnostico",
  severity: "alto",
  blocking: false,
  field: "cid_code",
  message: (ctx) => {
    const raw = ctx.getField("cid_code")?.rawValue ?? ctx.getValue("cid_code");
    return `CID-10 "${raw ?? ""}" não encontrado no catálogo.`;
  },
  suggestedCorrection: "Selecione um CID-10 válido da tabela ativa.",
  evaluate: (ctx) => {
    if (ctx.isGuideType("guia_honorario")) return null;
    if (ctx.isMissing("cid_code")) return null;
    const raw = ctx.getField("cid_code")?.rawValue ?? ctx.getValue("cid_code");
    if (!raw) return null;
    const normalized = normalizeCid(raw);
    if (normalized == null) return null; // formato inválido já é DIA-002
    if (isCidInCatalog(normalized)) return null;
    return makeFinding(DIA_003, ctx, {
      detectedValue: normalized,
      expectedValue: "CID-10 ativo no catálogo",
      field: "cid_code",
    });
  },
};

export const DIAGNOSTICO_RULES: AuditRule[] = [DIA_001, DIA_002, DIA_003];
