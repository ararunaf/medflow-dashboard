/**
 * SEC-PII-01 — PII / External-AI Gate.
 *
 * Ponto único de decisão: nenhum recorte de imagem de um campo classificado
 * como PII sensível (grupo "paciente" — identificação do paciente; grupo
 * "diagnostico" — dado de saúde, categoria sensível sob a LGPD Art. 5º II)
 * pode sair para o AIProviderPort (vision, provedor externo) sem que a
 * política explícita `MEDICFLOW_ALLOW_PII_EXTERNAL_AI=true` esteja
 * configurada no ambiente do servidor. Ausente/qualquer outro valor = nega
 * (fail-closed) — mesmo padrão de "sem fallback inseguro" já aplicado ao
 * restante do hardening deste P1.
 *
 * A decisão de bloqueio é sempre registrada via SemanticFallbackDecision
 * (mesmo mecanismo de log já usado para o skip de mime type não suportado)
 * — nunca falha silenciosamente, nunca lança (best-effort, como os demais
 * skips do fallback semântico).
 */
import type { StructuredField, StructuredFieldGroup } from "../../parser/types/structured-guide";

/** Grupos que carregam dado pessoal do paciente ou dado de saúde (LGPD "dado sensível"). */
export const PII_SENSITIVE_FIELD_GROUPS: readonly StructuredFieldGroup[] = [
  "paciente",
  "diagnostico",
];

export function isPiiSensitiveFieldGroup(group: StructuredFieldGroup): boolean {
  return (PII_SENSITIVE_FIELD_GROUPS as readonly string[]).includes(group);
}

export type ExternalAiPiiGateDecision = {
  allowed: boolean;
  /** Motivo do bloqueio (null quando allowed=true). Mesmo texto vira `skippedReason` do fallback. */
  reason: string | null;
};

/**
 * Lê a política explícita do ambiente do servidor. Nunca lança — configuração
 * ausente ou inválida é tratada como "não autorizado" (fail-closed).
 */
export function isExternalAiPiiPolicyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MEDICFLOW_ALLOW_PII_EXTERNAL_AI === "true";
}

/**
 * Avalia se um campo pode ser enviado ao AIProviderPort externo.
 * Campos fora dos grupos sensíveis são sempre permitidos (nada muda para
 * eles). Campos sensíveis exigem a política explícita habilitada.
 */
export function evaluateExternalAiPiiGate(
  field: Pick<StructuredField, "group">,
  env: NodeJS.ProcessEnv = process.env,
): ExternalAiPiiGateDecision {
  if (!isPiiSensitiveFieldGroup(field.group)) {
    return { allowed: true, reason: null };
  }
  if (isExternalAiPiiPolicyEnabled(env)) {
    return { allowed: true, reason: null };
  }
  return {
    allowed: false,
    reason:
      `Bloqueado pelo PII/External-AI Gate — campo do grupo "${field.group}" contém dado pessoal ` +
      "sensível (LGPD) e o envio a provedor de IA externo requer MEDICFLOW_ALLOW_PII_EXTERNAL_AI=true.",
  };
}
