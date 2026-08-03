/**
 * RulePackEngineStore — contrato interno do store (TISS-03).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria XML; NÃO conhece operadoras/contratos/tenants.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { CanonicalRuleExecution, CanonicalRulePack } from "../ports/canonical";

export type StoredRulePack = CanonicalRulePack;
export type StoredRuleExecution = CanonicalRuleExecution;

export interface RulePackEngineStore {
  readonly storeId: string;

  getPack(packId: string): StoredRulePack | undefined;
  getPackByCode(code: string): StoredRulePack | undefined;
  setPack(pack: StoredRulePack): void;
  listPacks(): readonly StoredRulePack[];

  getExecution(executionId: string): StoredRuleExecution | undefined;
  setExecution(execution: StoredRuleExecution): void;
  listExecutions(): readonly StoredRuleExecution[];

  packCount(): number;
  executionCount(): number;
  health(): { ok: boolean; message?: string };
}
