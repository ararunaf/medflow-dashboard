/**
 * ContractStore — contrato interno do store (EPC-11).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO valida contratos.
 */
import type { Contract } from "../ports/types";

export type StoredContract = Contract;

export interface ContractStore {
  readonly storeId: string;

  getContract(contractId: string): StoredContract | undefined;
  setContract(contract: StoredContract): void;
  listContracts(): readonly StoredContract[];
  removeContract(contractId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
