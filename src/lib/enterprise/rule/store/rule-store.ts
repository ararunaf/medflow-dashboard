/**
 * RuleStore — contrato interno do store (EPC-06A).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations.
 * Prep futuro: implementação backed by PersistencePort.
 */
import type { RuleDefinition } from "../ports/types";

export type StoredRuleDefinition = RuleDefinition;

export interface RuleStore {
  readonly storeId: string;

  getRule(id: string): StoredRuleDefinition | undefined;
  setRule(rule: StoredRuleDefinition): void;
  listRules(): readonly StoredRuleDefinition[];
  removeRule(id: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
