/**
 * DefaultContractStore — store in-process padrão (EPC-11).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { ContractStore, StoredContract } from "./contract-store";

export const DEFAULT_CONTRACT_STORE_ID = "default-in-process";

export type DefaultContractStoreOptions = {
  contracts?: readonly StoredContract[];
};

export class DefaultContractStore implements ContractStore {
  readonly storeId = DEFAULT_CONTRACT_STORE_ID;

  private readonly contracts = new Map<string, StoredContract>();

  constructor(options: DefaultContractStoreOptions = {}) {
    for (const contract of options.contracts ?? []) {
      this.contracts.set(contract.contractId, contract);
    }
  }

  getContract(contractId: string): StoredContract | undefined {
    return this.contracts.get(contractId);
  }

  setContract(contract: StoredContract): void {
    this.contracts.set(contract.contractId, contract);
  }

  listContracts(): readonly StoredContract[] {
    return [...this.contracts.values()];
  }

  removeContract(contractId: string): boolean {
    return this.contracts.delete(contractId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultContractStore ready (${this.contracts.size} contracts).`,
    };
  }
}
