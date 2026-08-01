/**
 * DefaultRuleStore — store in-process padrão (EPC-06A).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 *
 * Persistência futura: substituir por adapter PersistencePort.
 */
import type { StoredRuleDefinition, RuleStore } from "./rule-store";

export const DEFAULT_RULE_STORE_ID = "default-in-process";

export type DefaultRuleStoreOptions = {
  rules?: readonly StoredRuleDefinition[];
};

export class DefaultRuleStore implements RuleStore {
  readonly storeId = DEFAULT_RULE_STORE_ID;

  private readonly rules = new Map<string, StoredRuleDefinition>();

  constructor(options: DefaultRuleStoreOptions = {}) {
    for (const rule of options.rules ?? []) {
      this.rules.set(rule.id, rule);
    }
  }

  getRule(id: string): StoredRuleDefinition | undefined {
    return this.rules.get(id);
  }

  setRule(rule: StoredRuleDefinition): void {
    this.rules.set(rule.id, rule);
  }

  listRules(): readonly StoredRuleDefinition[] {
    return [...this.rules.values()];
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultRuleStore ready (${this.rules.size} rules).`,
    };
  }
}
