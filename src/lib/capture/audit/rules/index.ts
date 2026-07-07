/**
 * Registro central de regras — Motor de Auditoria Preventiva.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { AuditRule, AuditRuleCategory } from "../types/audit-rule";
import { PACIENTE_RULES } from "./paciente-rules";
import { OPERADORA_RULES } from "./operadora-rules";
import { PRESTADOR_RULES } from "./prestador-rules";
import { SOLICITANTE_RULES } from "./solicitante-rules";
import { EXECUTANTE_RULES } from "./executante-rules";
import { PROCEDIMENTOS_RULES } from "./procedimentos-rules";
import { DIAGNOSTICO_RULES } from "./diagnostico-rules";
import { AUTORIZACOES_RULES } from "./autorizacoes-rules";
import { DATAS_RULES } from "./datas-rules";
import { ASSINATURAS_RULES } from "./assinaturas-rules";
import { TISS_RULES } from "./tiss-rules";

export const ALL_AUDIT_RULES: AuditRule[] = [
  ...PACIENTE_RULES,
  ...OPERADORA_RULES,
  ...PRESTADOR_RULES,
  ...SOLICITANTE_RULES,
  ...EXECUTANTE_RULES,
  ...PROCEDIMENTOS_RULES,
  ...DIAGNOSTICO_RULES,
  ...AUTORIZACOES_RULES,
  ...DATAS_RULES,
  ...ASSINATURAS_RULES,
  ...TISS_RULES,
];

export function getRulesByCategory(category: AuditRuleCategory): AuditRule[] {
  return ALL_AUDIT_RULES.filter((r) => r.category === category);
}

export function getRuleById(id: string): AuditRule | undefined {
  return ALL_AUDIT_RULES.find((r) => r.id === id);
}

export const AUDIT_RULE_COUNT = ALL_AUDIT_RULES.length;
