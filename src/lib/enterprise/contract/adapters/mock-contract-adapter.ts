/**
 * MockContractAdapter — EPC-11.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 */
import { createContractId } from "../ports/identity";
import type { ContractPort } from "../ports/contract-port";
import type {
  Contract,
  ContractCapabilities,
  ContractHealth,
  ContractProviderId,
  CreateContractInput,
  CreateContractResult,
  GetContractInput,
  GetContractResult,
  ListContractsInput,
  ListContractsResult,
} from "../ports/types";

export type MockContractAdapterOptions = {
  provider?: Extract<ContractProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  contracts?: readonly Contract[];
  createId?: () => string;
};

export class MockContractAdapter implements ContractPort {
  readonly providerId: Extract<ContractProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly contracts = new Map<string, Contract>();
  private readonly createId: () => string;

  constructor(options: MockContractAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} contract ready.`;
    this.createId = options.createId ?? createContractId;

    for (const contract of options.contracts ?? []) {
      this.contracts.set(contract.contractId, contract);
    }
  }

  capabilities(): ContractCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createContract(input: CreateContractInput): Promise<CreateContractResult> {
    const contractId = input.contract.contractId ?? this.createId();
    const existing = this.contracts.get(contractId);

    const contract: Contract = {
      ...input.contract,
      contractId,
      name: input.contract.name,
      version: input.contract.version ?? existing?.version ?? "1",
      status: input.contract.status ?? existing?.status ?? "draft",
    };

    this.contracts.set(contractId, contract);
    return {
      ok: true,
      contractId,
      contract,
      message: existing ? "contract updated" : "contract created",
      code: existing ? "updated" : "created",
    };
  }

  async getContract(input: GetContractInput): Promise<GetContractResult> {
    const contract = this.contracts.get(input.contractId);
    if (!contract) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, contract };
  }

  async listContracts(input: ListContractsInput = {}): Promise<ListContractsResult> {
    const contracts = [...this.contracts.values()].filter((contract) =>
      matchesList(contract, input),
    );
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
