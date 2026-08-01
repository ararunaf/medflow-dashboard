/**
 * Helpers de versionamento — EPC-11 FASE 8.
 *
 * Preparação estrutural apenas. Sem implementação operacional.
 * Prepara: Draft | Published | Deprecated | Archived | Rollback.
 * Sem persistência real. Sem política de publicação de produto.
 */
import type {
  Contract,
  ContractStatus,
  ContractVersion,
  ContractVersionInfo,
  ContractVersionLabel,
} from "./types";
import { CONTRACT_STATUSES } from "./types";

/** Extrai o bloco de versionamento estrutural de um contrato. */
export function getVersionInfo(contract: Contract): ContractVersionInfo {
  return {
    version: contract.version,
    status: contract.status,
  };
}

/** Define um registro ContractVersion (auxiliar — sem persistência). */
export function defineContractVersion(options: {
  version: ContractVersionLabel;
  previousVersion?: ContractVersionLabel;
  nextVersion?: ContractVersionLabel;
  status?: ContractStatus;
  rollbackTarget?: ContractVersionLabel;
  effectiveDate?: string;
  expirationDate?: string;
  notes?: string;
}): ContractVersion {
  return {
    version: options.version,
    previousVersion: options.previousVersion,
    nextVersion: options.nextVersion,
    status: options.status,
    rollbackTarget: options.rollbackTarget,
    effectiveDate: options.effectiveDate,
    expirationDate: options.expirationDate,
    notes: options.notes,
  };
}

/** Aplica rótulo de versão / status sem mutar o original (estrutural). */
export function withVersionInfo(
  contract: Contract,
  info: Partial<Pick<Contract, "version" | "status">>,
): Contract {
  return {
    ...contract,
    version: info.version ?? contract.version,
    status: info.status ?? contract.status,
  };
}

/** True se o status é um dos lifecycle conhecidos (FASE 8). */
export function hasKnownStatus(contract: Contract): boolean {
  return (CONTRACT_STATUSES as readonly string[]).includes(contract.status);
}

/** True se o contrato está em status draft. */
export function isDraft(contract: Contract): boolean {
  return contract.status === "draft";
}

/** True se o contrato declara status published. */
export function isPublished(contract: Contract): boolean {
  return contract.status === "published";
}

/**
 * Prepara um alvo de rollback (estrutural).
 * NÃO executa rollback. NÃO altera persistência.
 */
export function prepareRollbackTarget(
  version: ContractVersionLabel,
  rollbackTarget: ContractVersionLabel,
): ContractVersion {
  return defineContractVersion({
    version,
    status: "rollback",
    rollbackTarget,
  });
}
