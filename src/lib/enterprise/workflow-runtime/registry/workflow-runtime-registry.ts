/**
 * WorkflowRuntimeRegistry — catálogo de mecanismos (C-10).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem workflow funcional. Sem BPM. Sem decisão automática.
 */
import {
  DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKFLOW_RUNTIME_VERSION,
} from "../adapters/default-workflow-runtime-adapter";
import {
  DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION,
  MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-workflow-runtime-adapter";
import {
  DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  WorkflowRuntimeProviderId,
  WorkflowRuntimeRegistration,
  WorkflowRuntimeStatus,
} from "../ports/types";

export type WorkflowRuntimeRegistrySnapshot = {
  registrations: readonly WorkflowRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly WorkflowRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Workflow Runtime",
    version: DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Workflow Runtime mock — no functional workflow, no BPM, no automatic decision, no network.",
  },
  {
    providerId: "test",
    name: "Test Workflow Runtime",
    version: DEFAULT_MOCK_WORKFLOW_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WORKFLOW_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Workflow Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Workflow Runtime",
    version: DEFAULT_WORKFLOW_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-10).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Corporate Workflow Runtime",
    version: DEFAULT_WORKFLOW_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-10 Enterprise Corporate Workflow Runtime — structural WorkflowManifest / WorkflowExecution / WorkflowExecutionResult / WorkflowStateMachine foundation (pure orchestration — no functional workflow).",
  },
];

export class WorkflowRuntimeRegistry {
  private readonly byId = new Map<WorkflowRuntimeProviderId, WorkflowRuntimeRegistration>();

  constructor(seed: readonly WorkflowRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: WorkflowRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: WorkflowRuntimeProviderId): WorkflowRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: WorkflowRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly WorkflowRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: WorkflowRuntimeStatus): readonly WorkflowRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): WorkflowRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultWorkflowRuntimeRegistry(): WorkflowRuntimeRegistry {
  return new WorkflowRuntimeRegistry();
}

export const BUILTIN_WORKFLOW_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
