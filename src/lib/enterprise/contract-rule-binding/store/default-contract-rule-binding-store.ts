/**
 * DefaultContractRuleBindingStore — store in-process padrão (EPC-17).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type {
  ContractRuleBindingStore,
  StoredContractRuleBinding,
} from "./contract-rule-binding-store";

export const DEFAULT_CONTRACT_RULE_BINDING_STORE_ID = "default-in-process";

export type DefaultContractRuleBindingStoreOptions = {
  bindings?: readonly StoredContractRuleBinding[];
};

export class DefaultContractRuleBindingStore implements ContractRuleBindingStore {
  readonly storeId = DEFAULT_CONTRACT_RULE_BINDING_STORE_ID;

  private readonly bindings = new Map<string, StoredContractRuleBinding>();

  constructor(options: DefaultContractRuleBindingStoreOptions = {}) {
    for (const binding of options.bindings ?? []) {
      this.bindings.set(binding.bindingId, binding);
    }
  }

  getBinding(bindingId: string): StoredContractRuleBinding | undefined {
    return this.bindings.get(bindingId);
  }

  setBinding(binding: StoredContractRuleBinding): void {
    this.bindings.set(binding.bindingId, binding);
  }

  listBindings(): readonly StoredContractRuleBinding[] {
    return [...this.bindings.values()];
  }

  removeBinding(bindingId: string): boolean {
    return this.bindings.delete(bindingId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultContractRuleBindingStore ready (${this.bindings.size} bindings).`,
    };
  }
}
