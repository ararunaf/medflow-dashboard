/**
 * MockRulePackEngineAdapter — TISS-03.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem XML. Sem operadoras. Sem banco.
 */
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES } from "../ports/capabilities";
import type { RulePackEnginePort } from "../ports/rule-pack-engine-port";
import type {
  ExecutePackInput,
  ExecutePackResult,
  GetExecutionInput,
  GetExecutionResult,
  InterpretPackInput,
  InterpretPackResult,
  ListExecutionsInput,
  ListExecutionsResult,
  ListPacksInput,
  ListPacksResult,
  LoadPackInput,
  LoadPackResult,
  RulePackEngineEnterpriseDeps,
  RulePackEngineHealth,
  RulePackEngineInfo,
  RulePackEnginePortCapabilities,
  RulePackEngineProviderId,
  RulePackEngineProviderMetadata,
} from "../ports/types";
import type { RulePackEngineStore } from "../store";
import { DefaultRulePackEngineAdapter } from "./default-rule-pack-engine-adapter";

export const MOCK_RULE_PACK_ENGINE_ADAPTER_ID = "mock-deterministic-rule-pack-engine";
export const DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION = "1.0.0";

export type MockRulePackEngineAdapterOptions = {
  provider?: Extract<RulePackEngineProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: RulePackEngineStore;
  enterpriseDeps?: RulePackEngineEnterpriseDeps;
};

function mockMetadata(
  providerId: Extract<RulePackEngineProviderId, "mock" | "test">,
): RulePackEngineProviderMetadata {
  return {
    name: providerId === "test" ? "Test Rule Pack Engine" : "Mock Rule Pack Engine",
    version: DEFAULT_MOCK_RULE_PACK_ENGINE_VERSION,
    vendor: "medicflow-enterprise",
    description:
      "Deterministic in-process Rule Pack Engine mock — no network, no XML, no operators.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico.
 */
export class MockRulePackEngineAdapter implements RulePackEnginePort {
  readonly providerId: Extract<RulePackEngineProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: RulePackEngineProviderMetadata;
  private readonly delegate: DefaultRulePackEngineAdapter;

  constructor(options: MockRulePackEngineAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Rule Pack Engine ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    const enterpriseDeps =
      options.enterpriseDeps ??
      ({
        getTISSCatalogPort: () => createTISSCatalogPort({ provider: "mock" }),
      } satisfies RulePackEngineEnterpriseDeps);
    this.delegate = new DefaultRulePackEngineAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store,
      enterpriseDeps,
    });
  }

  getStore(): RulePackEngineStore {
    return this.delegate.getStore();
  }

  capabilities(): RulePackEnginePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
      engine: { ...DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      consumesTISSCatalogPort: true,
      implementsRealXml: false,
      implementsOperatorDispatch: false,
      implementsAnsValidation: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
    };
  }

  providerInfo(): RulePackEngineInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "RULE_PACK_ENGINE",
      capabilities: { ...DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<RulePackEngineHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
    };
  }

  async loadPack(input: LoadPackInput): Promise<LoadPackResult> {
    const result = await this.delegate.loadPack(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listPacks(input?: ListPacksInput): Promise<ListPacksResult> {
    const result = await this.delegate.listPacks(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async interpretPack(input: InterpretPackInput): Promise<InterpretPackResult> {
    const result = await this.delegate.interpretPack(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async executePack(input: ExecutePackInput): Promise<ExecutePackResult> {
    const result = await this.delegate.executePack(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getExecution(input: GetExecutionInput): Promise<GetExecutionResult> {
    const result = await this.delegate.getExecution(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listExecutions(input?: ListExecutionsInput): Promise<ListExecutionsResult> {
    const result = await this.delegate.listExecutions(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
