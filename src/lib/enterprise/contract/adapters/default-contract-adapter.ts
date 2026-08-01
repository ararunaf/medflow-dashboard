/**
 * DefaultContractAdapter — adapter default de Contract Foundation (EPC-11).
 *
 * Encapsula o Default Contract Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera UI / APIs / Rule Engine.
 * NÃO valida contratos. NÃO executa regras.
 */
import { createContractId } from "../ports/identity";
import type { ContractPort } from "../ports/contract-port";
import type {
  Contract,
  ContractCapabilities,
  ContractHealth,
  CreateContractInput,
  CreateContractResult,
  GetContractInput,
  GetContractResult,
  ListContractsInput,
  ListContractsResult,
} from "../ports/types";
import { DefaultContractStore, type ContractStore } from "../store";

export const DEFAULT_CONTRACT_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultContractRuntime = {
  /** Store ativo. Default: DefaultContractStore in-process. */
  store?: ContractStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
};

function defaultRuntime(): DefaultContractRuntime {
  return {
    store: new DefaultContractStore(),
  };
}

export class DefaultContractAdapter implements ContractPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultContractRuntime;
  private readonly store: ContractStore;

  constructor(runtime: DefaultContractRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultContractStore();
  }

  capabilities(): ContractCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_CONTRACT_ADAPTER_ID,
      supportsCreateContract: true,
      supportsGetContract: true,
      supportsListContracts: true,
      supportsVersioning: true,
      supportsAttachments: true,
      supportsRulePackReferences: true,
      supportsWorkflowReferences: true,
      supportsConfigurationReference: true,
      supportsMetadataReference: true,
      supportsDocumentIdentityReferences: true,
    };
  }

  async health(): Promise<ContractHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok ? "Default contract probe ok." : "Default contract probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultContractStore pronto (sem I/O externo — EPC-11).",
    };
  }

  async createContract(input: CreateContractInput): Promise<CreateContractResult> {
    const contractId = input.contract.contractId ?? this.runtime.createId?.() ?? createContractId();
    const existing = this.store.getContract(contractId);

    const contract: Contract = {
      ...input.contract,
      contractId,
      name: input.contract.name,
      version: input.contract.version ?? existing?.version ?? "1",
      status: input.contract.status ?? existing?.status ?? "draft",
    };

    this.store.setContract(contract);
    return {
      ok: true,
      contractId,
      contract,
      message: existing ? "contract updated" : "contract created",
      code: existing ? "updated" : "created",
    };
  }

  async getContract(input: GetContractInput): Promise<GetContractResult> {
    const contract = this.store.getContract(input.contractId);
    if (!contract) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, contract };
  }

  async listContracts(input: ListContractsInput = {}): Promise<ListContractsResult> {
    const contracts = this.store.listContracts().filter((contract) => matchesList(contract, input));
    return { ok: true, contracts };
  }
}

function matchesList(contract: Contract, input: ListContractsInput): boolean {
  if (input.status != null && contract.status !== input.status) return false;
  if (input.tag != null && !(contract.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !contract.contractId.startsWith(input.idPrefix)) return false;
  if (input.namePrefix != null && !contract.name.startsWith(input.namePrefix)) return false;
  if (input.rulePackId != null) {
    const refs = contract.rulePackReferences ?? [];
    if (!refs.some((ref) => ref.packId === input.rulePackId)) return false;
  }
  if (input.workflowId != null) {
    const refs = contract.workflowReferences ?? [];
    if (!refs.some((ref) => ref.workflowId === input.workflowId)) return false;
  }
  return true;
}
