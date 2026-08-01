/**
 * ContractRuleBindingStore — contrato interno do store (EPC-17).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO carrega Contratos ou Rule Packs.
 * NÃO executa regras.
 */
import type { ContractRuleBinding } from "../ports/types";

export type StoredContractRuleBinding = ContractRuleBinding;

export interface ContractRuleBindingStore {
  readonly storeId: string;

  getBinding(bindingId: string): StoredContractRuleBinding | undefined;
  setBinding(binding: StoredContractRuleBinding): void;
  listBindings(): readonly StoredContractRuleBinding[];
  removeBinding(bindingId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
