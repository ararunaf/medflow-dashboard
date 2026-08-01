/**
 * RulePackStore — contrato interno do store (EPC-09).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO resolve dependências.
 */
import type { RulePack } from "../ports/types";

export type StoredRulePack = RulePack;

export interface RulePackStore {
  readonly storeId: string;

  getPack(packId: string): StoredRulePack | undefined;
  setPack(pack: StoredRulePack): void;
  listPacks(): readonly StoredRulePack[];
  removePack(packId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
