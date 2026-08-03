/**
 * InMemoryRulePackEngineStore — store in-process (TISS-03).
 *
 * Implementação oficial do Rule Pack Store.
 * Sem banco. Sem XML. Sem operadoras. Sem contratos. Sem tenants.
 */
import type {
  StoredRuleExecution,
  StoredRulePack,
  RulePackEngineStore,
} from "./rule-pack-engine-store";
import { MINIMAL_STRUCTURAL_RULE_PACKS } from "./seed";

export const IN_MEMORY_RULE_PACK_ENGINE_STORE_ID = "in-memory-rule-pack-engine";

export type InMemoryRulePackEngineStoreOptions = {
  seedMinimalExamples?: boolean;
  packs?: readonly StoredRulePack[];
};

/**
 * Store de Rule Packs in-memory — exclusivo do Adapter (TISS-03).
 */
export class InMemoryRulePackEngineStore implements RulePackEngineStore {
  readonly storeId = IN_MEMORY_RULE_PACK_ENGINE_STORE_ID;

  private readonly packs = new Map<string, StoredRulePack>();
  private readonly packsByCode = new Map<string, string>();
  private readonly executions = new Map<string, StoredRuleExecution>();

  constructor(options: InMemoryRulePackEngineStoreOptions = {}) {
    const seed = options.seedMinimalExamples !== false;
    if (seed) {
      for (const pack of MINIMAL_STRUCTURAL_RULE_PACKS) this.setPack(pack);
    }
    for (const pack of options.packs ?? []) this.setPack(pack);
  }

  getPack(packId: string): StoredRulePack | undefined {
    const pack = this.packs.get(packId);
    return pack ? { ...pack, rules: [...pack.rules] } : undefined;
  }

  getPackByCode(code: string): StoredRulePack | undefined {
    const packId = this.packsByCode.get(code);
    return packId ? this.getPack(packId) : undefined;
  }

  setPack(pack: StoredRulePack): void {
    this.packs.set(pack.packId, { ...pack, rules: [...pack.rules] });
    this.packsByCode.set(pack.code, pack.packId);
  }

  listPacks(): readonly StoredRulePack[] {
    return Array.from(this.packs.values()).map((pack) => ({
      ...pack,
      rules: [...pack.rules],
    }));
  }

  getExecution(executionId: string): StoredRuleExecution | undefined {
    const execution = this.executions.get(executionId);
    return execution ? { ...execution } : undefined;
  }

  setExecution(execution: StoredRuleExecution): void {
    this.executions.set(execution.executionId, { ...execution });
  }

  listExecutions(): readonly StoredRuleExecution[] {
    return Array.from(this.executions.values()).map((execution) => ({ ...execution }));
  }

  packCount(): number {
    return this.packs.size;
  }

  executionCount(): number {
    return this.executions.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Rule Pack Engine store ready (${this.packCount()} packs).`,
    };
  }
}
