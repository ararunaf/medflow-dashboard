/**
 * Tipos de regras — Motor de Auditoria Preventiva.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { StructuredFieldGroup } from "../../parser/types/structured-guide";
import type { AuditFinding } from "./audit-finding";
import type { AuditRuleContext } from "../engine/audit-context";

export const AUDIT_RULE_CATEGORIES = [
  "paciente",
  "operadora",
  "prestador",
  "solicitante",
  "executante",
  "procedimentos",
  "diagnostico",
  "autorizacoes",
  "datas",
  "assinaturas",
] as const;

export type AuditRuleCategory = (typeof AUDIT_RULE_CATEGORIES)[number];

export const AUDIT_SEVERITIES = ["critico", "alto", "medio", "baixo"] as const;

export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export type AuditRule = {
  id: string;
  name: string;
  description: string;
  category: AuditRuleCategory;
  severity: AuditSeverity;
  blocking: boolean;
  /** Campo principal afetado pela regra */
  field: string;
  /** Mensagem padrão ou função dinâmica */
  message: string | ((ctx: AuditRuleContext) => string);
  /** Correção sugerida */
  suggestedCorrection: string;
  /** Condição — retorna finding se a regra for violada, null se OK */
  evaluate: (ctx: AuditRuleContext) => Omit<AuditFinding, "id"> | null;
};

/** Mapeia grupo StructuredGuide → categoria de auditoria */
export const FIELD_GROUP_TO_CATEGORY: Record<StructuredFieldGroup, AuditRuleCategory> = {
  paciente: "paciente",
  operadora: "operadora",
  prestador: "prestador",
  solicitante: "solicitante",
  executante: "executante",
  procedimentos: "procedimentos",
  diagnostico: "diagnostico",
  autorizacoes: "autorizacoes",
  datas: "datas",
  assinaturas: "assinaturas",
  observacoes: "paciente",
};
