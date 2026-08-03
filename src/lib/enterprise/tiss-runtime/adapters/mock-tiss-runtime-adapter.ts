/**
 * MockTISSRuntimeAdapter — TISS-01 / TISS-02 / TISS-03 / TISS-04.
 *
 * Determinístico in-process. Pode usar enterpriseDeps quando disponíveis.
 */
import { createCanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import { createRulePackEnginePort } from "../../rule-pack-engine/providers/create-rule-pack-engine-port";
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { createTISSProviderPort } from "../../tiss-provider/providers/create-tiss-provider-port";
import { createXMLRuntimePort } from "../../xml-runtime/providers/create-xml-runtime-port";
import type { TISSRuntimePort } from "../ports/tiss-runtime-port";
import type {
  GetTISSRuntimeSessionInput,
  GetTISSRuntimeSessionResult,
  ListTISSRuntimeSessionsInput,
  ListTISSRuntimeSessionsResult,
  RuntimeTISSProcessInput,
  RuntimeTISSProcessResult,
  TISSRuntimeCapabilities,
  TISSRuntimeEnterpriseDeps,
  TISSRuntimeHealth,
  TISSRuntimeProviderId,
} from "../ports/types";
import type { TISSRuntimeStore } from "../store";
import { DefaultTISSRuntimeAdapter } from "./default-tiss-runtime-adapter";

export const MOCK_TISS_RUNTIME_ADAPTER_ID = "mock-deterministic-tiss-runtime";

export type MockTISSRuntimeAdapterOptions = {
  provider?: Extract<TISSRuntimeProviderId, "mock" | "test">;
  store?: TISSRuntimeStore;
  enterpriseDeps?: TISSRuntimeEnterpriseDeps;
  healthy?: boolean;
};

export class MockTISSRuntimeAdapter implements TISSRuntimePort {
  readonly providerId: Extract<TISSRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly delegate: DefaultTISSRuntimeAdapter;

  constructor(options: MockTISSRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;

    const catalogPort = createTISSCatalogPort({ provider: "mock" });
    const rulePackEnginePort = createRulePackEnginePort({
      provider: "mock",
      enterpriseDeps: { getTISSCatalogPort: () => catalogPort },
    });
    const enterpriseDeps: TISSRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getOrchestratorPort: () => createCanonicalExecutionOrchestratorPort({ provider: "mock" }),
      getTISSProviderPort: () => createTISSProviderPort({ provider: "mock" }),
      getTISSCatalogPort: () => catalogPort,
      getRulePackEnginePort: () => rulePackEnginePort,
      getXMLRuntimePort: () =>
        createXMLRuntimePort({
          provider: "mock",
          enterpriseDeps: {
            getTISSCatalogPort: () => catalogPort,
            getRulePackEnginePort: () => rulePackEnginePort,
          },
        }),
    };

    this.delegate = new DefaultTISSRuntimeAdapter({
      enterpriseDeps,
      store: options.store,
    });
  }

  capabilities(): TISSRuntimeCapabilities {
    return {
      ...this.delegate.capabilities(),
      provider: this.providerId,
      adapterId: MOCK_TISS_RUNTIME_ADAPTER_ID,
    };
  }

  async health(): Promise<TISSRuntimeHealth> {
    if (!this.healthy) {
      return {
        ok: false,
        provider: this.providerId,
        message: "Mock TISS Runtime unhealthy.",
      };
    }
    const health = await this.delegate.health();
    return { ...health, provider: this.providerId };
  }

  async process(input: RuntimeTISSProcessInput): Promise<RuntimeTISSProcessResult> {
    return this.delegate.process(input);
  }

  async getSession(input: GetTISSRuntimeSessionInput): Promise<GetTISSRuntimeSessionResult> {
    return this.delegate.getSession(input);
  }

  async listSessions(input?: ListTISSRuntimeSessionsInput): Promise<ListTISSRuntimeSessionsResult> {
    return this.delegate.listSessions(input);
  }
}
