/**
 * DefaultRulePackStore — store in-process padrão (EPC-09).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { RulePackStore, StoredRulePack } from "./rule-pack-store";

export const DEFAULT_RULE_PACK_STORE_ID = "default-in-process";

export type DefaultRulePackStoreOptions = {
  packs?: readonly StoredRulePack[];
};

export class DefaultRulePackStore implements RulePackStore {
  readonly storeId = DEFAULT_RULE_PACK_STORE_ID;

  private readonly packs = new Map<string, StoredRulePack>();

  constructor(options: DefaultRulePackStoreOptions = {}) {
    for (const pack of options.packs ?? []) {
      this.packs.set(pack.packId, pack);
    }
  }

  getPack(packId: string): StoredRulePack | undefined {
    return this.packs.get(packId);
  }

  setPack(pack: StoredRulePack): void {
    this.packs.set(pack.packId, pack);
  }

  listPacks(): readonly StoredRulePack[] {
    return [...this.packs.values()];
  }

  removePack(packId: string): boolean {
    return this.packs.delete(packId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultRulePackStore ready (${this.packs.size} packs).`,
    };
  }
}
