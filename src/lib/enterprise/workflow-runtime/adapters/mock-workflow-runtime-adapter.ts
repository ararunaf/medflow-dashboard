/**
 * MockWorkflowRuntimeAdapter — C-10 / ECS-01.
 *
 * Implementação totalmente determinística in-process.
 * Sem workflow funcional. Sem BPM. Sem decisão automática. Sem execução de runtime.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  toWorkflowCapabilities,
} from "../ports/capabilities";
import type { WorkflowRuntimePort } from "../ports/workflow-runtime-port";
import type {
  GetWorkflowExecutionInput,
  GetWorkflowExecutionResult,
  ListWorkflowExecutionsInput,
  ListWorkflowExecutionsResult,
  PrepareWorkflowExecutionInput,
  PrepareWorkflowExecutionResult,
  WorkflowRuntimeCapabilities,
  WorkflowRuntimeEnterpriseDeps,
  WorkflowRuntimeHealth,
  WorkflowRuntimeInfo,
  WorkflowRuntimeProviderId,
  WorkflowRuntimeProviderMetadata,
  WorkflowStatsInput,
  WorkflowStatsResult,
} from "../ports/types";
import type { WorkflowRuntimeStore } from "../store";
import { InMemoryWorkflowRuntimeStore } from "../store";
import { DefaultWorkflowRuntimeAdapter } from "./default-workflow-runtime-adapter";

export const MOCK_WORKFLOW_RUNTIME_ADAPTER_ID = "mock-deterministic-workflow-runtime";
export const DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION = "1.0.0";

export type MockWorkflowRuntimeAdapterOptions = {
  provider?: Extract<WorkflowRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: WorkflowRuntimeStore;
  enterpriseDeps?: WorkflowRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<WorkflowRuntimeProviderId, "mock" | "test">,
): WorkflowRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Workflow Runtime" : "Mock Workflow Runtime",
    version: DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Workflow Runtime mock — no functional workflow, no BPM, no automatic decision, no network.",
  };
}

export class MockWorkflowRuntimeAdapter implements WorkflowRuntimePort {
  readonly providerId: Extract<WorkflowRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: WorkflowRuntimeProviderMetadata;
  private readonly delegate: DefaultWorkflowRuntimeAdapter;

  constructor(options: MockWorkflowRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Workflow Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultWorkflowRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryWorkflowRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): WorkflowRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): WorkflowRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareWorkflowExecution: true,
      supportsGetWorkflowExecution: true,
      supportsListWorkflowExecutions: true,
      supportsStats: true,
      supportsCanonicalWorkflowManifest: true,
      supportsCanonicalWorkflowExecutionResult: true,
      supportsWorkflowStateMachine: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesReconciliationRuntimePort: true,
      usesReturnRuntimePort: true,
      usesAuthorizationRuntimePort: true,
      usesOperatorRuntimePort: true,
      usesProtocolRuntimePort: true,
      usesBatchRuntimePort: true,
      usesSOAPRuntimePort: true,
      usesXMLRuntimePort: true,
      usesXMLValidationRuntimePort: true,
      usesAuditRuntimePort: true,
      runtimeReady: true,
      workflowImplemented: false,
      workflowExecutionImplemented: false,
      automaticDecisionImplemented: false,
      runtimeExecutionImplemented: false,
      engine: { ...DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toWorkflowCapabilities(DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): WorkflowRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WORKFLOW_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<WorkflowRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async prepareWorkflowExecution(
    input: PrepareWorkflowExecutionInput,
  ): Promise<PrepareWorkflowExecutionResult> {
    const result = await this.delegate.prepareWorkflowExecution(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getWorkflowExecution(
    input: GetWorkflowExecutionInput,
  ): Promise<GetWorkflowExecutionResult> {
    const result = await this.delegate.getWorkflowExecution(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async listWorkflowExecutions(
    input?: ListWorkflowExecutionsInput,
  ): Promise<ListWorkflowExecutionsResult> {
    const result = await this.delegate.listWorkflowExecutions(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: WorkflowStatsInput): Promise<WorkflowStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}
