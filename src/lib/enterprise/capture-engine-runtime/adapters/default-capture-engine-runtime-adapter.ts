/**
 * DefaultCaptureEngineRuntimeAdapter — adapter default (DIP-02 / DIP-03).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *
 * NÃO reimplementa intake. NÃO cria adapters paralelos.
 * NÃO executa OCR real, IA, XML, TISS, parser, classificação, Workflow,
 * Rule Engine, Storage Manager, versionamento ou busca.
 */
import { createCaptureRuntimeSessionId } from "../ports/identity";
import type { CaptureEngineRuntimePort } from "../ports/capture-engine-runtime-port";
import type { CanonicalCaptureSession } from "../ports/models";
import type {
  CaptureEngineRuntimeCapabilities,
  CaptureEngineRuntimeEnterpriseDeps,
  CaptureEngineRuntimeHealth,
  GetCaptureRuntimeSessionInput,
  GetCaptureRuntimeSessionResult,
  ListCaptureRuntimeSessionsInput,
  ListCaptureRuntimeSessionsResult,
  RegisterCaptureInput,
  RegisterCaptureResult,
} from "../ports/types";
import { InMemoryCaptureEngineRuntimeStore, type CaptureEngineRuntimeStore } from "../store";

export const DEFAULT_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

export type DefaultCaptureEngineRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: CaptureEngineRuntimeEnterpriseDeps;
  store?: CaptureEngineRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): CaptureEngineRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
    supportsRegisterCapture: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesDocumentIntakeRuntime: true,
    usesDocumentIntakePort: true,
    usesOCRRuntime: true,
    implementsOcr: false,
    implementsAi: false,
    implementsXml: false,
    implementsTiss: false,
    implementsParser: false,
    implementsClassification: false,
    implementsWorkflow: false,
    implementsRuleEngine: false,
    implementsStorageManager: false,
    implementsVersioning: false,
    implementsSearch: false,
  };
}

export class DefaultCaptureEngineRuntimeAdapter implements CaptureEngineRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: CaptureEngineRuntimeEnterpriseDeps;
  private readonly store: CaptureEngineRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultCaptureEngineRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultCaptureEngineRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + DocumentIntakeRuntime + OCRRuntime). Implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryCaptureEngineRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createCaptureRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): CaptureEngineRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<CaptureEngineRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, intakeRuntimeHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getDocumentIntakeRuntimePort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && intakeRuntimeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      documentIntakeRuntimeOk: intakeRuntimeHealth.ok,
      message: ok
        ? "Capture Engine Runtime pronto (Orchestrator + DocumentIntakeRuntime)."
        : "Capture Engine Runtime degradado — ver Ports Enterprise.",
    };
  }

  async registerCapture(input: RegisterCaptureInput): Promise<RegisterCaptureResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-capture-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
      };
    }

    let session: CanonicalCaptureSession = {
      kind: "canonical-capture-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.store.setSession(session);

    try {
      session = {
        ...session,
        status: "coordinating",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const orchestrator = this.enterpriseDeps.getOrchestratorPort();
      const channel =
        input.configuration?.channel ?? input.metadata.channel ?? "capture-engine-runtime";
      const sourceType = input.configuration?.sourceType ?? "UPLOAD";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["dip-02", "capture-engine-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: sourceType,
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "DIP-02: capture registered via Capture Engine Runtime (no OCR/IA).",
      });

      if (!execution.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          updatedAt: nowIso(this.now),
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
          errors: [execution.message ?? "ORCHESTRATOR_FAILED"],
        };
        this.store.setSession(session);
        return {
          kind: "canonical-capture-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          message: session.message,
          code: session.code,
        };
      }

      session = {
        ...session,
        status: "registering",
        executionId: execution.context?.executionId,
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const documentIntakeRuntime = this.enterpriseDeps.getDocumentIntakeRuntimePort();
      const intakeResult = await documentIntakeRuntime.registerIntake({
        kind: "canonical-document-intake-request",
        identity: {
          kind: "canonical-document-intake-identity",
          documentId: input.identity.documentId,
          documentKind: input.identity.documentKind ?? "capture-document",
          version: input.identity.version,
        },
        metadata: {
          kind: "canonical-document-intake-metadata",
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
          channel,
          tags: ["dip-02", "capture-engine-runtime", ...(input.metadata.tags ?? [])],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            captureRuntimeSessionId: runtimeSessionId,
            captureExecutionId: execution.context?.executionId ?? null,
            ...(input.metadata.customAttributes ?? {}),
          },
        },
        source: {
          kind: "canonical-document-intake-source",
          sourceType,
          channel,
        },
        reference: {
          kind: "canonical-document-intake-reference",
          storageKey: input.reference?.storageKey,
          storageContainer: input.reference?.storageContainer ?? "clinical-documents",
          storageProvider: input.reference?.storageProvider ?? "product-capture",
          metadataId: input.reference?.metadataId ?? input.metadata.sessionId,
          metadataNamespace: input.reference?.metadataNamespace ?? "product.capture",
        },
        capabilities: {
          kind: "canonical-document-intake-capabilities",
          declared: input.capabilities?.declared ?? [
            "capture-engine-runtime",
            "document-intake-runtime",
          ],
        },
        structuralNotes:
          input.configuration?.notes ??
          input.structuralNotes ??
          "DIP-02: intake delegated from Capture Engine Runtime (no OCR/IA).",
      });

      if (!intakeResult.ok) {
        session = {
          ...session,
          status: "failed",
          intakeId: intakeResult.intakeId,
          intakeRuntimeSessionId: intakeResult.runtimeSessionId,
          intakeExecutionId: intakeResult.executionId,
          updatedAt: nowIso(this.now),
          message: intakeResult.message ?? "DocumentIntakeRuntime registerIntake falhou.",
          code: intakeResult.code ?? "INTAKE_RUNTIME_FAILED",
          errors: [intakeResult.message ?? "INTAKE_RUNTIME_FAILED"],
        };
        this.store.setSession(session);
        return {
          kind: "canonical-capture-result",
          ok: false,
          runtimeSessionId,
          session,
          intakeId: intakeResult.intakeId,
          executionId: execution.context?.executionId,
          intakeRuntimeSessionId: intakeResult.runtimeSessionId,
          message: session.message,
          code: session.code,
        };
      }

      // DIP-03 — coordenação estrutural via OCR Runtime (sem OCR real / sem process()).
      const ocrRuntime = this.enterpriseDeps.getOCRRuntimePort();
      const ocrResult = await ocrRuntime.coordinateOcr({
        kind: "canonical-ocr-request",
        identity: {
          kind: "canonical-ocr-identity",
          documentId: input.identity.documentId,
          documentKind: input.identity.documentKind ?? "capture-document",
          version: input.identity.version,
        },
        metadata: {
          kind: "canonical-ocr-metadata",
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
          channel,
          tags: ["dip-03", "capture-engine-runtime", "ocr-runtime", ...(input.metadata.tags ?? [])],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            captureRuntimeSessionId: runtimeSessionId,
            captureExecutionId: execution.context?.executionId ?? null,
            intakeId: intakeResult.intakeId ?? null,
            ...(input.metadata.customAttributes ?? {}),
          },
        },
        reference: {
          kind: "canonical-ocr-reference",
          storageKey: input.reference?.storageKey,
          storageContainer: input.reference?.storageContainer ?? "clinical-documents",
          storageProvider: input.reference?.storageProvider ?? "product-capture",
          metadataId: input.reference?.metadataId ?? input.metadata.sessionId,
          metadataNamespace: input.reference?.metadataNamespace ?? "product.capture",
          intakeId: intakeResult.intakeId,
          executionId: execution.context?.executionId,
          captureRuntimeSessionId: runtimeSessionId,
          captureExecutionId: execution.context?.executionId,
          providerReferenceId: "mock",
        },
        capabilities: {
          kind: "canonical-ocr-capabilities",
          supportsPdf: false,
          supportsImage: false,
          supportsBatch: false,
          supportsStreaming: false,
          supportsHandwriting: false,
          supportsTables: false,
          supportsForms: false,
          supportsConfidenceScore: false,
          declared: ["capture-engine-runtime", "ocr-runtime-structural"],
        },
        configuration: {
          kind: "canonical-ocr-configuration",
          preferredProviderReference: "mock",
          channel,
          priority: input.configuration?.priority ?? "NORMAL",
          notes: "DIP-03: structural OCR coordination from Capture Engine Runtime (no real OCR).",
        },
        structuralNotes:
          "DIP-03: OCR coordinated from Capture Engine Runtime (no real OCR / no external providers).",
      });

      session = {
        ...session,
        status: "registered",
        intakeId: intakeResult.intakeId,
        executionId: execution.context?.executionId,
        intakeRuntimeSessionId: intakeResult.runtimeSessionId,
        intakeExecutionId: intakeResult.executionId,
        ocrRuntimeSessionId: ocrResult.runtimeSessionId,
        ocrExecutionId: ocrResult.executionId,
        updatedAt: nowIso(this.now),
        message: ocrResult.ok
          ? "Capture registered via Capture Engine Runtime Ports (+ OCR Runtime structural)."
          : "Capture registered; OCR Runtime coordination reported non-ok (no real OCR).",
        code: "REGISTERED",
      };
      this.store.setSession(session);

      return {
        kind: "canonical-capture-result",
        ok: true,
        runtimeSessionId,
        session,
        intakeId: intakeResult.intakeId,
        executionId: execution.context?.executionId,
        intakeRuntimeSessionId: intakeResult.runtimeSessionId,
        ocrRuntimeSessionId: ocrResult.runtimeSessionId,
        ocrExecutionId: ocrResult.executionId,
        message: session.message,
        code: session.code,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
      };
      this.store.setSession(session);
      return {
        kind: "canonical-capture-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
      };
    }
  }

  async getSession(input: GetCaptureRuntimeSessionInput): Promise<GetCaptureRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListCaptureRuntimeSessionsInput = {},
  ): Promise<ListCaptureRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }
}

function matchesList(
  session: CanonicalCaptureSession,
  input: ListCaptureRuntimeSessionsInput,
): boolean {
  if (input.status != null && session.status !== input.status) return false;
  if (input.documentId != null && session.request.identity.documentId !== input.documentId) {
    return false;
  }
  if (input.sessionId != null && session.request.metadata.sessionId !== input.sessionId) {
    return false;
  }
  if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
    return false;
  }
  return true;
}
