/**
 * DefaultWorkflowRuntimeAdapter — C-10 / ECS-01.
 *
 * Adapter oficial do Enterprise Corporate Workflow Runtime.
 * Responde estruturalmente (prepareWorkflowExecution/getWorkflowExecution/
 * listWorkflowExecutions/stats) sem depender de Ports Enterprise.
 *
 * WORKFLOW IS PURE ORCHESTRATION (Regra Permanente nº 18): este adapter
 * exclusivamente orquestra o envelope estrutural — nunca valida XML, nunca
 * reconcilia, nunca autoriza, nunca gera SOAP, nunca fala com operadoras,
 * nunca processa lotes, nunca roda IA, e nunca implementa regras de domínio.
 *
 * Sem workflow funcional. Sem BPM. Sem decisão automática. Sem execução de
 * runtime. Sem filas. Sem workers. Sem scheduler. Sem banco.
 */
import {
  DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES,
  toWorkflowCapabilities,
} from "../ports/capabilities";
import {
  WORKFLOW_RUNTIME_IDENTITY,
  createWorkflowContextId,
  createWorkflowExecutionId,
  createWorkflowManifestId,
  createWorkflowRuntimeRequestId,
} from "../ports/identity";
import type { WorkflowRuntimePort } from "../ports/workflow-runtime-port";
import type { WorkflowContext, WorkflowManifest, WorkflowStateMachine } from "../ports/canonical";
import {
  createEmptyWorkflowExecution,
  createEmptyWorkflowExecutionPolicy,
  createEmptyWorkflowExecutionResult,
  createEmptyWorkflowManifest,
  createEmptyWorkflowStateMachine,
} from "../ports/canonical";
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
  WorkflowRuntimeOperationalControls,
  WorkflowRuntimeOperationEnvelope,
  WorkflowRuntimeProviderId,
  WorkflowRuntimeProviderMetadata,
  WorkflowRuntimeStructuredLog,
  WorkflowStatsInput,
  WorkflowStatsResult,
} from "../ports/types";
import { InMemoryWorkflowRuntimeStore, type WorkflowRuntimeStore } from "../store";

export const DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID = "default-enterprise-workflow-runtime";
export const DEFAULT_WORKFLOW_RUNTIME_VERSION = WORKFLOW_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultWorkflowRuntimeAdapterOptions = {
  provider?: Extract<WorkflowRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: WorkflowRuntimeStore;
  enterpriseDeps?: WorkflowRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: WorkflowRuntimeOperationalControls): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function portShapeOk(port: unknown): boolean {
  return (
    !!port &&
    typeof (port as { health?: unknown }).health === "function" &&
    typeof (port as { capabilities?: unknown }).capabilities === "function"
  );
}

function structuralFlags() {
  return {
    workflowImplemented: false,
    workflowExecutionImplemented: false,
    automaticDecisionImplemented: false,
    runtimeExecutionImplemented: false,
  } as const;
}

function resolveStateMachine(input: PrepareWorkflowExecutionInput): WorkflowStateMachine {
  return createEmptyWorkflowStateMachine(input.stateMachine ?? input.manifest?.stateMachine);
}

function resolveManifest(
  input: PrepareWorkflowExecutionInput,
  workflowExecutionId: string,
  stamp: string,
): WorkflowManifest {
  const stateMachine = resolveStateMachine(input);
  const executionPolicy =
    input.executionPolicy ??
    input.manifest?.executionPolicy ??
    createEmptyWorkflowExecutionPolicy();
  return createEmptyWorkflowManifest({
    ...input.manifest,
    workflowId: input.manifest?.workflowId ?? createWorkflowManifestId(),
    workflowExecutionId,
    transactionId: input.transactionId ?? input.manifest?.transactionId,
    correlationId: input.correlationId ?? input.manifest?.correlationId,
    state: input.state ?? input.manifest?.state ?? "CREATED",
    stateMachine,
    metadata: input.metadata ?? input.manifest?.metadata,
    executionPolicy,
    execution: input.execution ?? input.manifest?.execution,
    result: input.result ?? input.manifest?.result,
    reconciliationResult: input.reconciliationResult ?? input.manifest?.reconciliationResult,
    returnManifest: input.returnManifest ?? input.manifest?.returnManifest,
    authorizationStrategy: input.authorizationStrategy ?? input.manifest?.authorizationStrategy,
    authorizationPolicy: input.authorizationPolicy ?? input.manifest?.authorizationPolicy,
    operatorProfile: input.operatorProfile ?? input.manifest?.operatorProfile,
    batchManifest: input.batchManifest ?? input.manifest?.batchManifest,
    protocolProfile: input.protocolProfile ?? input.manifest?.protocolProfile,
    soapEnvelope: input.soapEnvelope ?? input.manifest?.soapEnvelope,
    xmlDocument: input.xmlDocument ?? input.manifest?.xmlDocument,
    xmlValidationResult: input.xmlValidationResult ?? input.manifest?.xmlValidationResult,
    auditResult: input.auditResult ?? input.manifest?.auditResult,
    tags: input.tags ?? input.manifest?.tags ?? [],
    owner: input.owner ?? input.manifest?.owner,
    ...structuralFlags(),
  });
}

/**
 * Adapter oficial C-10 — Workflow Runtime default / enterprise.
 * Nunca orquestra de fato. Nunca decide automaticamente. Nunca executa
 * workflow. Nunca implementa transições de estado (RULE_11). RULE_18 vigente.
 */
export class DefaultWorkflowRuntimeAdapter implements WorkflowRuntimePort {
  readonly providerId: Extract<WorkflowRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: WorkflowRuntimeProviderMetadata;
  private readonly store: WorkflowRuntimeStore;
  private readonly enterpriseDeps: WorkflowRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultWorkflowRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Workflow Runtime ready (structural only — pure orchestration, no functional workflow).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default Workflow Runtime" : WORKFLOW_RUNTIME_IDENTITY.name,
      version: DEFAULT_WORKFLOW_RUNTIME_VERSION,
      vendor: WORKFLOW_RUNTIME_IDENTITY.vendor,
      layer: WORKFLOW_RUNTIME_IDENTITY.layer,
      vendorAgnostic: WORKFLOW_RUNTIME_IDENTITY.vendorAgnostic,
      description: WORKFLOW_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryWorkflowRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  getStore(): WorkflowRuntimeStore {
    return this.store;
  }

  capabilities(): WorkflowRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_WORKFLOW_RUNTIME_ADAPTER_ID,
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
      ...structuralFlags(),
      engine: { ...DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toWorkflowCapabilities(DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): WorkflowRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "WORKFLOW_RUNTIME",
      capabilities: { ...DEFAULT_WORKFLOW_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<WorkflowRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    let reconciliationRuntimeOk = true;
    let returnRuntimeOk = true;
    let authorizationRuntimeOk = true;
    let operatorRuntimeOk = true;
    let protocolRuntimeOk = true;
    let batchRuntimeOk = true;
    let soapRuntimeOk = true;
    let xmlRuntimeOk = true;
    let xmlValidationRuntimeOk = true;
    let auditRuntimeOk = true;

    if (typeof this.enterpriseDeps.getReconciliationRuntimePort === "function") {
      reconciliationRuntimeOk = portShapeOk(this.enterpriseDeps.getReconciliationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getReturnRuntimePort === "function") {
      returnRuntimeOk = portShapeOk(this.enterpriseDeps.getReturnRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuthorizationRuntimePort === "function") {
      authorizationRuntimeOk = portShapeOk(this.enterpriseDeps.getAuthorizationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getOperatorRuntimePort === "function") {
      operatorRuntimeOk = portShapeOk(this.enterpriseDeps.getOperatorRuntimePort());
    }
    if (typeof this.enterpriseDeps.getProtocolRuntimePort === "function") {
      protocolRuntimeOk = portShapeOk(this.enterpriseDeps.getProtocolRuntimePort());
    }
    if (typeof this.enterpriseDeps.getBatchRuntimePort === "function") {
      batchRuntimeOk = portShapeOk(this.enterpriseDeps.getBatchRuntimePort());
    }
    if (typeof this.enterpriseDeps.getSOAPRuntimePort === "function") {
      soapRuntimeOk = portShapeOk(this.enterpriseDeps.getSOAPRuntimePort());
    }
    if (typeof this.enterpriseDeps.getXMLRuntimePort === "function") {
      xmlRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      reconciliationRuntimeOk &&
      returnRuntimeOk &&
      authorizationRuntimeOk &&
      operatorRuntimeOk &&
      protocolRuntimeOk &&
      batchRuntimeOk &&
      soapRuntimeOk &&
      xmlRuntimeOk &&
      xmlValidationRuntimeOk &&
      auditRuntimeOk;

    return {
      kind: "canonical-workflow-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      reconciliationRuntimeOk,
      returnRuntimeOk,
      authorizationRuntimeOk,
      operatorRuntimeOk,
      protocolRuntimeOk,
      batchRuntimeOk,
      soapRuntimeOk,
      xmlRuntimeOk,
      xmlValidationRuntimeOk,
      auditRuntimeOk,
      storedManifestCount: this.store.manifestCount(),
      storedContextCount: this.store.contextCount(),
      storedExecutionCount: this.store.executionCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "Workflow Runtime pronto (estrutural C-10 — pure orchestration; sem workflow funcional)."
          : "Workflow Runtime degradado — ver Ports Enterprise."
        : "Workflow Runtime unhealthy.",
    };
  }

  async prepareWorkflowExecution(
    input: PrepareWorkflowExecutionInput,
  ): Promise<PrepareWorkflowExecutionResult> {
    return this.runOperation("prepareWorkflowExecution", input, async () => {
      const stamp = nowIso(this.now);
      // RULE_18 / requisito ECS-01: workflowExecutionId é sempre gerado
      // novo — identifica UMA execução específica e NUNCA é reaproveitado.
      const workflowExecutionId = createWorkflowExecutionId();
      const manifest = resolveManifest(input, workflowExecutionId, stamp);
      this.store.setManifest(manifest);

      const execution = createEmptyWorkflowExecution({
        ...input.execution,
        workflowExecutionId,
        transactionId: manifest.transactionId,
        correlationId: manifest.correlationId,
        state: manifest.state,
        startedAt: stamp,
        finishedAt: stamp,
        duration: 0,
      });
      this.store.setExecution(execution);

      const result =
        input.result ??
        createEmptyWorkflowExecutionResult({
          workflowExecutionId,
          transactionId: manifest.transactionId,
          status: manifest.state,
          auditReference: manifest.auditResult ? "structural-audit-ref" : undefined,
        });
      this.store.setResult(result);

      const workflowContext: WorkflowContext = {
        ...(input.workflowContext ?? {
          kind: "canonical-workflow-context" as const,
          contextId: createWorkflowContextId(),
        }),
        kind: "canonical-workflow-context",
        contextId: input.workflowContext?.contextId ?? createWorkflowContextId(),
        transactionId: manifest.transactionId,
        workflowExecutionId,
        correlationId: manifest.correlationId ?? input.workflowContext?.correlationId ?? null,
        operationId: input.workflowContext?.operationId ?? createWorkflowRuntimeRequestId(),
        executionStartedAt: stamp,
        executionFinishedAt: stamp,
        executionDuration: 0,
        executionStatus: manifest.state ?? "CREATED",
        warnings: input.workflowContext?.warnings ?? [],
        errors: input.workflowContext?.errors ?? [],
        traceMetadata: input.workflowContext?.traceMetadata ?? {},
        manifest,
        execution,
        result,
        state: manifest.state,
        stateMachine: manifest.stateMachine,
        metadata: manifest.metadata,
        reconciliationResult: manifest.reconciliationResult,
        returnManifest: manifest.returnManifest,
        authorizationStrategy: manifest.authorizationStrategy,
        authorizationPolicy: manifest.authorizationPolicy,
        operatorProfile: manifest.operatorProfile,
        batchManifest: manifest.batchManifest,
        protocolProfile: manifest.protocolProfile,
        soapEnvelope: manifest.soapEnvelope,
        xmlDocument: manifest.xmlDocument,
        xmlValidationResult: manifest.xmlValidationResult,
        auditResult: manifest.auditResult,
        structuralNotes: input.workflowContext?.structuralNotes ?? manifest.structuralNotes,
      };
      this.store.setContext(workflowContext);

      return {
        ok: true,
        manifest,
        workflowContext,
        execution,
        result,
        executed: false as const,
        workflowImplemented: false as const,
        workflowExecutionImplemented: false as const,
        automaticDecisionImplemented: false as const,
        runtimeExecutionImplemented: false as const,
        code: "WORKFLOW_RUNTIME_OK",
        message:
          "Canonical WorkflowManifest/WorkflowExecution structural envelope (C-10 foundation — pure orchestration / RULE_18).",
      };
    });
  }

  async getWorkflowExecution(
    input: GetWorkflowExecutionInput,
  ): Promise<GetWorkflowExecutionResult> {
    return this.runOperation("getWorkflowExecution", input, async () => {
      if (input.workflowExecutionId) {
        const execution = this.store.getExecution(input.workflowExecutionId);
        if (!execution) {
          return {
            ok: false,
            code: "WORKFLOW_RUNTIME_NOT_FOUND",
            message: "Canonical WorkflowExecution not found.",
          };
        }
        const manifests = this.store
          .listManifests()
          .filter((m) => m.workflowExecutionId === input.workflowExecutionId);
        const result = this.store.getResult(input.workflowExecutionId);
        return {
          ok: true,
          execution,
          manifest: manifests[0],
          result,
          code: "WORKFLOW_RUNTIME_OK",
          message: "Canonical WorkflowExecution loaded.",
        };
      }
      if (input.transactionId) {
        const manifests = this.store
          .listManifests()
          .filter((m) => m.transactionId === input.transactionId);
        const manifest = manifests[0];
        if (!manifest) {
          return {
            ok: false,
            code: "WORKFLOW_RUNTIME_NOT_FOUND",
            message: "Canonical WorkflowManifest not found for transactionId.",
          };
        }
        return {
          ok: true,
          manifest,
          execution: manifest.workflowExecutionId
            ? this.store.getExecution(manifest.workflowExecutionId)
            : undefined,
          result: manifest.result,
          code: "WORKFLOW_RUNTIME_OK",
          message: "Canonical WorkflowManifest loaded by transactionId.",
        };
      }
      if (input.contextId) {
        const workflowContext = this.store.getContext(input.contextId);
        if (!workflowContext) {
          return {
            ok: false,
            code: "WORKFLOW_RUNTIME_NOT_FOUND",
            message: "Canonical WorkflowContext not found.",
          };
        }
        return {
          ok: true,
          workflowContext,
          manifest: workflowContext.manifest,
          execution: workflowContext.execution,
          result: workflowContext.result,
          code: "WORKFLOW_RUNTIME_OK",
          message: "Canonical WorkflowContext loaded.",
        };
      }
      if (input.correlationId) {
        const manifests = this.store
          .listManifests()
          .filter((m) => m.correlationId === input.correlationId);
        const manifest = manifests[0];
        if (!manifest) {
          return {
            ok: false,
            code: "WORKFLOW_RUNTIME_NOT_FOUND",
            message: "Canonical WorkflowManifest not found for correlationId.",
          };
        }
        return {
          ok: true,
          manifest,
          execution: manifest.workflowExecutionId
            ? this.store.getExecution(manifest.workflowExecutionId)
            : undefined,
          result: manifest.result,
          code: "WORKFLOW_RUNTIME_OK",
          message: "Canonical WorkflowManifest loaded by correlationId.",
        };
      }
      return {
        ok: false,
        code: "WORKFLOW_RUNTIME_INVALID_INPUT",
        message: "workflowExecutionId, transactionId, contextId or correlationId is required.",
      };
    });
  }

  async listWorkflowExecutions(
    input: ListWorkflowExecutionsInput = {},
  ): Promise<ListWorkflowExecutionsResult> {
    return this.runOperation("listWorkflowExecutions", input, async () => {
      let manifests = this.store.listManifests();
      if (input.state != null) {
        manifests = manifests.filter((m) => m.state === input.state);
      }
      return {
        ok: true,
        manifests,
        contexts: this.store.listContexts(),
        executions: this.store.listExecutions(),
        results: this.store.listResults(),
        statistics: this.store.statistics(),
        code: "WORKFLOW_RUNTIME_OK",
        message: `Listed ${manifests.length} canonical WorkflowManifests / ${this.store.executionCount()} executions.`,
      };
    });
  }

  async stats(input: WorkflowStatsInput = {}): Promise<WorkflowStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const manifest = createEmptyWorkflowManifest({
        workflowId: createWorkflowManifestId(),
        state: "CREATED",
        structuralNotes: "Workflow Runtime structural statistics",
      });
      void stamp;
      return {
        ok: true,
        statistics,
        manifest,
        code: "WORKFLOW_RUNTIME_OK",
        message: `Workflow Runtime stats: ${statistics.totalManifests} manifests / ${statistics.totalExecutions} executions.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: WorkflowRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & WorkflowRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createWorkflowRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: WorkflowRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "WORKFLOW_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & WorkflowRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "WORKFLOW_RUNTIME_RETRY",
            message: "Transient structural failure — retrying.",
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * attempts);
            continue;
          }
          break;
        }

        const outcome = await Promise.race([
          fn(),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => {
              reject(new Error("Workflow Runtime operation timed out."));
            }, timeoutMs);
            if (typeof timer === "object" && "unref" in timer) {
              (timer as { unref?: () => void }).unref?.();
            }
          }),
        ]);

        const end = typeof performance !== "undefined" ? performance.now() : Date.now();
        return {
          ...outcome,
          requestId,
          provider: this.providerId,
          telemetry: {
            latencyMs: Math.max(0, Math.round(end - started)),
            attempts,
            cancelled: false,
            operation,
          },
          logs,
        };
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "WORKFLOW_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "Workflow Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & WorkflowRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "Workflow Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "WORKFLOW_RUNTIME_CANCELLED"
          : isTimeout
            ? "WORKFLOW_RUNTIME_TIMEOUT"
            : "WORKFLOW_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & WorkflowRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-10). */
export const EnterpriseWorkflowRuntimeAdapter = DefaultWorkflowRuntimeAdapter;
