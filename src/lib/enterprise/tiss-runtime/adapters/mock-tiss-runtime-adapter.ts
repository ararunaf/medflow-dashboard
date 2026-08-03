/**
 * MockTISSRuntimeAdapter — TISS-01…TISS-05.
 *
 * Determinístico in-process. Pode usar enterpriseDeps quando disponíveis.
 */
import { createCanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import { createRulePackEnginePort } from "../../rule-pack-engine/providers/create-rule-pack-engine-port";
import { createTISSCatalogPort } from "../../tiss-catalog/providers/create-tiss-catalog-port";
import { createTISSProviderPort } from "../../tiss-provider/providers/create-tiss-provider-port";
import { createXMLGenerationRuntimePort } from "../../xml-generation-runtime/providers/create-xml-generation-runtime-port";
import { createXMLRuntimePort } from "../../xml-runtime/providers/create-xml-runtime-port";
import { createXMLSchemaRuntimePort } from "../../xml-schema-runtime/providers/create-xml-schema-runtime-port";
import { createXMLSerializerRuntimePort } from "../../xml-serializer-runtime/providers/create-xml-serializer-runtime-port";
import { createXMLValidationRuntimePort } from "../../xml-validation-runtime/providers/create-xml-validation-runtime-port";
import { createXSDRuntimePort } from "../../xsd-runtime/providers/create-xsd-runtime-port";
import { createNamespaceRuntimePort } from "../../namespace-runtime/providers/create-namespace-runtime-port";
import { createQueueRuntimePort } from "../../queue-runtime/providers/create-queue-runtime-port";
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
    const xmlGenerationRuntimePort = createXMLGenerationRuntimePort({ provider: "mock" });
    const xmlSerializerRuntimePort = createXMLSerializerRuntimePort({ provider: "mock" });
    const xmlSchemaRuntimePort = createXMLSchemaRuntimePort({ provider: "mock" });
    const xmlValidationRuntimePort = createXMLValidationRuntimePort({ provider: "mock" });
    const xsdRuntimePort = createXSDRuntimePort({ provider: "mock" });
    const namespaceRuntimePort = createNamespaceRuntimePort({ provider: "mock" });
    const queueRuntimePort = createQueueRuntimePort({ provider: "mock" });
    const enterpriseDeps: TISSRuntimeEnterpriseDeps = options.enterpriseDeps ?? {
      getOrchestratorPort: () => createCanonicalExecutionOrchestratorPort({ provider: "mock" }),
      getTISSProviderPort: () => createTISSProviderPort({ provider: "mock" }),
      getTISSCatalogPort: () => catalogPort,
      getRulePackEnginePort: () => rulePackEnginePort,
      getXMLGenerationRuntimePort: () => xmlGenerationRuntimePort,
      getXMLSerializerRuntimePort: () => xmlSerializerRuntimePort,
      getXMLSchemaRuntimePort: () => xmlSchemaRuntimePort,
      getXMLValidationRuntimePort: () => xmlValidationRuntimePort,
      getXSDRuntimePort: () => xsdRuntimePort,
      getNamespaceRuntimePort: () => namespaceRuntimePort,
      getQueueRuntimePort: () => queueRuntimePort,
      getXMLRuntimePort: () =>
        createXMLRuntimePort({
          provider: "mock",
          enterpriseDeps: {
            getTISSCatalogPort: () => catalogPort,
            getRulePackEnginePort: () => rulePackEnginePort,
            getXMLGenerationRuntimePort: () => xmlGenerationRuntimePort,
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
