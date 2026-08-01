/**
 * RuleFactory — construção estrutural de RuleDefinitions (EPC-06A).
 *
 * Normaliza defaults (status, timestamps, version) sem avaliar Conditions
 * nem executar Actions. Sem parser, sem DSL, sem linguagem.
 *
 * Posição na arquitetura:
 *   Adapter → Store → RuleFactory → (Provider resolve Port)
 */
import type { RuleDefinition, RuleStatus } from "../ports/types";

export type CreateRuleDefinitionInput = {
  rule: RuleDefinition;
  /** Status default quando ausente. */
  defaultStatus?: RuleStatus;
  /** Timestamp ISO opcional (default: agora). */
  at?: string;
  /** Rule existente (para preservar createdAt em updates). */
  existing?: RuleDefinition;
};

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Materializa uma RuleDefinition pronta para store.
 * NÃO valida domínio. NÃO avalia. NÃO executa.
 */
export function createRuleDefinition(input: CreateRuleDefinitionInput): RuleDefinition {
  const at = input.at ?? nowIso();
  const existing = input.existing;

  return {
    ...input.rule,
    status: input.rule.status ?? existing?.status ?? input.defaultStatus ?? "draft",
    version: input.rule.version ?? existing?.version ?? "1",
    createdAt: existing?.createdAt ?? input.rule.createdAt ?? at,
    updatedAt: at,
  };
}

/**
 * Aplica mudança estrutural de status (enable/disable).
 * NÃO avalia Conditions. NÃO dispara Actions.
 */
export function withRuleStatus(
  rule: RuleDefinition,
  status: RuleStatus,
  at?: string,
): RuleDefinition {
  return {
    ...rule,
    status,
    updatedAt: at ?? nowIso(),
  };
}
