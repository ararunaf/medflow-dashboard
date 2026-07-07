/**
 * Regras — Autorizações
 */
import { tussRequiresAuthorization } from "../data/tuss-catalog";
import type { AuditRule } from "../types/audit-rule";
import { missingFieldFinding } from "./rule-helpers";

export const AUT_001: AuditRule = {
  id: "AUT-001",
  name: "Autorização ausente",
  description: "Procedimentos que exigem autorização prévia devem ter senha vinculada.",
  category: "autorizacoes",
  severity: "critico",
  blocking: true,
  field: "authorization_password",
  message: "Senha de autorização não informada para procedimento que exige autorização prévia.",
  suggestedCorrection: "Vincule a senha de autorização ou solicite nova autorização à operadora.",
  evaluate: (ctx) => {
    const requiresAuth =
      ctx.isGuideType("guia_sadt", "guia_honorario") ||
      ctx.allProcedureCodes().some((c) => tussRequiresAuthorization(c));

    if (!requiresAuth) return null;
    if (ctx.isMissing("authorization_password")) {
      return missingFieldFinding(AUT_001, ctx);
    }
    return null;
  },
};

export const AUT_002: AuditRule = {
  id: "AUT-002",
  name: "Número da guia ausente",
  description: "Número interno da guia é recomendado para rastreabilidade.",
  category: "autorizacoes",
  severity: "medio",
  blocking: false,
  field: "guide_number",
  message: "Número da guia não informado.",
  suggestedCorrection: "Informe o número interno da guia.",
  evaluate: (ctx) => (ctx.isMissing("guide_number") ? missingFieldFinding(AUT_002, ctx) : null),
};

export const AUT_003: AuditRule = {
  id: "AUT-003",
  name: "Guia origem ausente (honorário)",
  description: "Guia de honorário individual deve referenciar a guia de origem.",
  category: "autorizacoes",
  severity: "alto",
  blocking: false,
  field: "parent_guide_number",
  message: "Guia de origem não informada para honorário individual.",
  suggestedCorrection: "Vincule a guia SADT ou internação de origem.",
  evaluate: (ctx) => {
    if (!ctx.isGuideType("guia_honorario")) return null;
    return ctx.isMissing("parent_guide_number") ? missingFieldFinding(AUT_003, ctx) : null;
  },
};

export const AUTORIZACOES_RULES: AuditRule[] = [AUT_001, AUT_002, AUT_003];
