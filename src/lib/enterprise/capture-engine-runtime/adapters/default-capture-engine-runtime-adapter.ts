/**
 * DefaultCaptureEngineRuntimeAdapter — adapter default (DIP-02 / DIP-03 / DIP-04 / DIP-05 / DIP-06).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort → Orchestrator → OCRProviderPort → Adapter (OCR-01)
 *   → DocumentClassificationRuntimePort → Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *   → StorageManagerRuntimePort → Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *   → DocumentSearchRuntimePort → Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *
 * NÃO reimplementa intake. NÃO cria adapters paralelos.
 * NÃO chama Azure/HTTP. OCR real exclusivamente via OCRRuntimePort.process().
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
  ProcessCaptureOcrInput,
  ProcessCaptureOcrResult,
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
    supportsProcessOcr: true,
    usesOCRRuntime: true,
    usesDocumentClassificationRuntime: true,
    usesStorageManagerRuntime: true,
    usesDocumentSearchRuntime: true,
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
          "(Orchestrator + DocumentIntakeRuntime + OCRRuntime + DocumentClassificationRuntime + StorageManagerRuntime + DocumentSearchRuntime). " +
          "Implementação paralela é proibida.",
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

      // OCR-01 — coordenação via OCR Runtime (execução real via processOcr / process).
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
          tags: ["ocr-01", "capture-engine-runtime", "ocr-runtime", ...(input.metadata.tags ?? [])],
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
          providerReferenceId: "azure",
        },
        capabilities: {
          kind: "canonical-ocr-capabilities",
          supportsPdf: true,
          supportsImage: true,
          supportsBatch: false,
          supportsStreaming: false,
          supportsHandwriting: true,
          supportsTables: true,
          supportsForms: false,
          supportsConfidenceScore: true,
          declared: ["capture-engine-runtime", "ocr-runtime", "ocr-01"],
        },
        configuration: {
          kind: "canonical-ocr-configuration",
          preferredProviderReference: "azure",
          channel,
          priority: input.configuration?.priority ?? "NORMAL",
          notes: "OCR-01: OCR coordination from Capture Engine Runtime via OCRProviderPort.",
        },
        structuralNotes:
          "OCR-01: OCR coordinated from Capture Engine Runtime → OCR Runtime → OCRProviderPort.",
      });

      // DIP-04 — coordenação estrutural via Document Classification Runtime (sem classificação real).
      const classificationRuntime = this.enterpriseDeps.getDocumentClassificationRuntimePort();
      const classificationResult = await classificationRuntime.coordinateClassification({
        kind: "canonical-document-classification-request",
        identity: {
          kind: "canonical-document-classification-identity",
          documentId: input.identity.documentId,
          documentKind: input.identity.documentKind ?? "capture-document",
          version: input.identity.version,
        },
        metadata: {
          kind: "canonical-document-classification-metadata",
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
          channel,
          tags: [
            "dip-04",
            "capture-engine-runtime",
            "document-classification-runtime",
            ...(input.metadata.tags ?? []),
          ],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            captureRuntimeSessionId: runtimeSessionId,
            captureExecutionId: execution.context?.executionId ?? null,
            intakeId: intakeResult.intakeId ?? null,
            ocrRuntimeSessionId: ocrResult.runtimeSessionId ?? null,
            ...(input.metadata.customAttributes ?? {}),
          },
        },
        reference: {
          kind: "canonical-document-classification-reference",
          storageKey: input.reference?.storageKey,
          storageContainer: input.reference?.storageContainer ?? "clinical-documents",
          storageProvider: input.reference?.storageProvider ?? "product-capture",
          metadataId: input.reference?.metadataId ?? input.metadata.sessionId,
          metadataNamespace: input.reference?.metadataNamespace ?? "product.capture",
          intakeId: intakeResult.intakeId,
          executionId: execution.context?.executionId,
          captureRuntimeSessionId: runtimeSessionId,
          captureExecutionId: execution.context?.executionId,
          ocrRuntimeSessionId: ocrResult.runtimeSessionId,
          ocrExecutionId: ocrResult.executionId,
          providerReferenceId: "mock",
        },
        capabilities: {
          kind: "canonical-document-classification-capabilities",
          supportsMedicalGuideClassification: false,
          supportsInvoiceClassification: false,
          supportsContractClassification: false,
          supportsBatchClassification: false,
          supportsConfidenceScore: false,
          supportsMultiLabelClassification: false,
          supportsCustomModels: false,
          supportsRuleBasedClassification: false,
          declared: ["capture-engine-runtime", "document-classification-runtime-structural"],
        },
        configuration: {
          kind: "canonical-document-classification-configuration",
          preferredProviderReference: "mock",
          channel,
          priority: input.configuration?.priority ?? "NORMAL",
          notes:
            "DIP-04: structural classification coordination from Capture Engine Runtime (no real classification).",
        },
        structuralNotes:
          "DIP-04: Classification coordinated from Capture Engine Runtime (no real classification / no AI / no ML).",
      });

      // DIP-05 — coordenação estrutural via Storage Manager Runtime (sem armazenamento real / sem upload).
      const storageManagerRuntime = this.enterpriseDeps.getStorageManagerRuntimePort();
      const storageResult = await storageManagerRuntime.coordinateStorage({
        kind: "canonical-storage-request",
        identity: {
          kind: "canonical-storage-identity",
          documentId: input.identity.documentId,
          documentKind: input.identity.documentKind ?? "capture-document",
          version: input.identity.version,
        },
        metadata: {
          kind: "canonical-storage-metadata",
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
          channel,
          tags: [
            "dip-05",
            "capture-engine-runtime",
            "storage-manager-runtime",
            ...(input.metadata.tags ?? []),
          ],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            captureRuntimeSessionId: runtimeSessionId,
            captureExecutionId: execution.context?.executionId ?? null,
            intakeId: intakeResult.intakeId ?? null,
            ocrRuntimeSessionId: ocrResult.runtimeSessionId ?? null,
            classificationRuntimeSessionId: classificationResult.runtimeSessionId ?? null,
            ...(input.metadata.customAttributes ?? {}),
          },
        },
        reference: {
          kind: "canonical-storage-reference",
          storageKey: input.reference?.storageKey,
          storageContainer: input.reference?.storageContainer ?? "clinical-documents",
          storageProvider: input.reference?.storageProvider ?? "product-capture",
          metadataId: input.reference?.metadataId ?? input.metadata.sessionId,
          metadataNamespace: input.reference?.metadataNamespace ?? "product.capture",
          intakeId: intakeResult.intakeId,
          executionId: execution.context?.executionId,
          captureRuntimeSessionId: runtimeSessionId,
          captureExecutionId: execution.context?.executionId,
          ocrRuntimeSessionId: ocrResult.runtimeSessionId,
          ocrExecutionId: ocrResult.executionId,
          classificationRuntimeSessionId: classificationResult.runtimeSessionId,
          classificationExecutionId: classificationResult.executionId,
          providerReferenceId: "mock-storage",
        },
        capabilities: {
          kind: "canonical-storage-capabilities",
          supportsVersioning: false,
          supportsRetentionPolicy: false,
          supportsEncryption: false,
          supportsCompression: false,
          supportsDeduplication: false,
          supportsCloudStorage: false,
          supportsLocalStorage: false,
          supportsImmutableStorage: false,
          declared: ["capture-engine-runtime", "storage-manager-runtime-structural"],
        },
        configuration: {
          kind: "canonical-storage-configuration",
          preferredProviderReference: "mock-storage",
          channel,
          priority: input.configuration?.priority ?? "NORMAL",
          notes:
            "DIP-05: structural storage coordination from Capture Engine Runtime (no real storage / no upload).",
        },
        structuralNotes:
          "DIP-05: Storage coordinated from Capture Engine Runtime (no real storage / no upload / no external providers).",
      });

      // DIP-06 — coordenação estrutural via Document Search Runtime (sem busca real / sem indexação).
      const documentSearchRuntime = this.enterpriseDeps.getDocumentSearchRuntimePort();
      const searchResult = await documentSearchRuntime.coordinateSearch({
        kind: "canonical-search-request",
        identity: {
          kind: "canonical-search-identity",
          documentId: input.identity.documentId,
          documentKind: input.identity.documentKind ?? "capture-document",
          version: input.identity.version,
        },
        metadata: {
          kind: "canonical-search-metadata",
          sessionId: input.metadata.sessionId,
          tenantRef: input.metadata.tenantRef,
          correlationId: input.metadata.correlationId,
          channel,
          tags: [
            "dip-06",
            "capture-engine-runtime",
            "document-search-runtime",
            ...(input.metadata.tags ?? []),
          ],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            captureRuntimeSessionId: runtimeSessionId,
            captureExecutionId: execution.context?.executionId ?? null,
            intakeId: intakeResult.intakeId ?? null,
            ocrRuntimeSessionId: ocrResult.runtimeSessionId ?? null,
            classificationRuntimeSessionId: classificationResult.runtimeSessionId ?? null,
            storageManagerRuntimeSessionId: storageResult.runtimeSessionId ?? null,
            ...(input.metadata.customAttributes ?? {}),
          },
        },
        reference: {
          kind: "canonical-search-reference",
          storageKey: input.reference?.storageKey,
          storageContainer: input.reference?.storageContainer ?? "clinical-documents",
          storageProvider: input.reference?.storageProvider ?? "product-capture",
          metadataId: input.reference?.metadataId ?? input.metadata.sessionId,
          metadataNamespace: input.reference?.metadataNamespace ?? "product.capture",
          intakeId: intakeResult.intakeId,
          executionId: execution.context?.executionId,
          captureRuntimeSessionId: runtimeSessionId,
          captureExecutionId: execution.context?.executionId,
          ocrRuntimeSessionId: ocrResult.runtimeSessionId,
          ocrExecutionId: ocrResult.executionId,
          classificationRuntimeSessionId: classificationResult.runtimeSessionId,
          classificationExecutionId: classificationResult.executionId,
          storageManagerRuntimeSessionId: storageResult.runtimeSessionId,
          storageExecutionId: storageResult.executionId,
          providerReferenceId: "mock-search",
        },
        capabilities: {
          kind: "canonical-search-capabilities",
          supportsKeywordSearch: false,
          supportsMetadataSearch: false,
          supportsFullTextSearch: false,
          supportsSemanticSearch: false,
          supportsVectorSearch: false,
          supportsBatchSearch: false,
          supportsRanking: false,
          supportsFacetedSearch: false,
          declared: ["capture-engine-runtime", "document-search-runtime-structural"],
        },
        configuration: {
          kind: "canonical-search-configuration",
          preferredProviderReference: "mock-search",
          channel,
          priority: input.configuration?.priority ?? "NORMAL",
          notes:
            "DIP-06: structural search coordination from Capture Engine Runtime (no real search / no indexing).",
        },
        structuralNotes:
          "DIP-06: Search coordinated from Capture Engine Runtime (no real search / no indexing / no external providers).",
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
        classificationRuntimeSessionId: classificationResult.runtimeSessionId,
        classificationExecutionId: classificationResult.executionId,
        storageManagerRuntimeSessionId: storageResult.runtimeSessionId,
        storageExecutionId: storageResult.executionId,
        documentSearchRuntimeSessionId: searchResult.runtimeSessionId,
        searchExecutionId: searchResult.executionId,
        updatedAt: nowIso(this.now),
        message:
          ocrResult.ok && classificationResult.ok && storageResult.ok && searchResult.ok
            ? "Capture registered via Capture Engine Runtime Ports (+ OCR + Classification + Storage Manager + Document Search Runtime structural)."
            : "Capture registered; OCR/Classification/Storage/Search Runtime coordination reported non-ok (no real processing/storage/search).",
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
        classificationRuntimeSessionId: classificationResult.runtimeSessionId,
        classificationExecutionId: classificationResult.executionId,
        storageManagerRuntimeSessionId: storageResult.runtimeSessionId,
        storageExecutionId: storageResult.executionId,
        documentSearchRuntimeSessionId: searchResult.runtimeSessionId,
        searchExecutionId: searchResult.executionId,
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

  async processOcr(input: ProcessCaptureOcrInput): Promise<ProcessCaptureOcrResult> {
    const ocrRuntime = this.enterpriseDeps.getOCRRuntimePort();
    return ocrRuntime.process({
      ...input,
      preferredProviderReference: input.preferredProviderReference ?? "azure",
    });
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
