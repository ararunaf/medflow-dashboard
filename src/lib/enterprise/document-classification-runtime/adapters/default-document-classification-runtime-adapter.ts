/**
 * DefaultDocumentClassificationRuntimeAdapter — adapter default (DIP-04 / CLASS-01).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → OCR Runtime
 *   → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter
 *
 * NÃO usa IA/LLM/ML/embeddings.
 * NÃO chama HTTP Azure/OpenAI.
 * Classificação real exclusivamente via DocumentClassificationProviderPort.classify().
 */
import type { DocumentClassificationProcessInput } from "../../document-classification-provider/ports/types";
import { createDocumentClassificationRuntimeSessionId } from "../ports/identity";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import type {
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
} from "../ports/types";
import {
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  resolveStructuralClassificationProviderReference,
} from "../ports/types";
import {
  InMemoryDocumentClassificationRuntimeStore,
  type DocumentClassificationRuntimeStore,
} from "../store";

export const DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

/** @deprecated CLASS-01 — prefer adapterId do DocumentClassificationProviderPort. */
export const STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID =
  "structural-classification-provider-adapter";

export type DefaultDocumentClassificationRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: DocumentClassificationRuntimeEnterpriseDeps;
  store?: DocumentClassificationRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): DocumentClassificationRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
    supportsCoordinateClassification: true,
    supportsClassify: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesOCRRuntime: true,
    usesCaptureEngineRuntime: true,
    usesDocumentClassificationProviderAdapter: true,
    supportsMedicalGuideClassification: true,
    supportsInvoiceClassification: true,
    supportsContractClassification: false,
    supportsBatchClassification: false,
    supportsConfidenceScore: true,
    supportsMultiLabelClassification: false,
    supportsCustomModels: false,
    supportsRuleBasedClassification: true,
    implementsRealClassification: true,
    implementsAi: false,
    implementsMachineLearning: false,
    implementsRuleEngine: false,
    implementsEmbeddings: false,
    implementsLlm: false,
    implementsOcrForClassification: false,
  };
}

function toProviderReferenceId(
  providerId: string,
): ReturnType<typeof resolveStructuralClassificationProviderReference>["providerReferenceId"] {
  switch (providerId) {
    case "rule-based":
    case "default":
      return "rule-based-classifier";
    case "mock":
    case "test":
      return "mock";
    case "ai-classifier":
    case "ml-classifier":
    case "hybrid-classifier":
      return providerId;
    default:
      return "rule-based-classifier";
  }
}

export class DefaultDocumentClassificationRuntimeAdapter implements DocumentClassificationRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: DocumentClassificationRuntimeEnterpriseDeps;
  private readonly store: DocumentClassificationRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultDocumentClassificationRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultDocumentClassificationRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + OCRRuntimePort + DocumentClassificationProviderPort). " +
          "Implementação paralela é proibida.",
      );
    }
    if (typeof options.enterpriseDeps.getDocumentClassificationProviderPort !== "function") {
      throw new Error(
        "DefaultDocumentClassificationRuntimeAdapter exige " +
          "enterpriseDeps.getDocumentClassificationProviderPort().",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryDocumentClassificationRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createDocumentClassificationRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): DocumentClassificationRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<DocumentClassificationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realClassificationAvailable: probe.ok,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, ocrRuntimeHealth, providerHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getOCRRuntimePort().health(),
      this.enterpriseDeps.getDocumentClassificationProviderPort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && ocrRuntimeHealth.ok && providerHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      ocrRuntimeOk: ocrRuntimeHealth.ok,
      classificationProviderAdapterOk: providerHealth.ok,
      realClassificationAvailable: providerHealth.ok,
      message: ok
        ? "Document Classification Runtime pronto (Orchestrator + OCR Runtime + Classification Provider — CLASS-01)."
        : "Document Classification Runtime degradado — ver Ports Enterprise.",
    };
  }

  async coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realClassificationExecuted: false,
      };
    }

    const classificationProvider = this.enterpriseDeps.getDocumentClassificationProviderPort();
    const providerCaps = classificationProvider.capabilities();
    const providerReference = resolveStructuralClassificationProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        toProviderReferenceId(classificationProvider.providerId),
    );

    let session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realClassificationExecuted: false,
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
        input.configuration?.channel ?? input.metadata.channel ?? "document-classification-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["class-01", "document-classification-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "document-classification-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          ocrRuntimeSessionId: input.reference?.ocrRuntimeSessionId ?? null,
          realClassificationExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "CLASS-01: Classification coordinated via Document Classification Runtime (execution via classify()).",
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
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      const ocrRuntime = this.enterpriseDeps.getOCRRuntimePort();
      const ocrCaps = ocrRuntime.capabilities();
      const ocrHealth = await ocrRuntime.health();

      if (!ocrHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          classificationProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: ocrHealth.message ?? "OCR Runtime health falhou.",
          code: "OCR_RUNTIME_UNHEALTHY",
          errors: [ocrHealth.message ?? "OCR_RUNTIME_UNHEALTHY"],
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      const providerHealth = await classificationProvider.health();
      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          classificationProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "Classification Provider Adapter health falhou.",
          code: "CLASSIFICATION_PROVIDER_ADAPTER_UNHEALTHY",
          errors: [providerHealth.message ?? "CLASSIFICATION_PROVIDER_ADAPTER_UNHEALTHY"],
          realClassificationExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-classification-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realClassificationExecuted: false,
        };
      }

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        classificationProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "Classification coordinated via Document Classification Runtime " +
          `(Orchestrator + OCR Runtime adapter=${ocrCaps.adapterId} + ` +
          `Classification Provider adapter=${providerCaps.adapterId} — execution via classify()).`,
        code: "COORDINATED",
        realClassificationExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-document-classification-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realClassificationExecuted: false,
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
        realClassificationExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realClassificationExecuted: false,
      };
    }
  }

  async classify(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const classificationProvider = this.enterpriseDeps.getDocumentClassificationProviderPort();
    const providerCaps = classificationProvider.capabilities();
    const providerReferenceId = toProviderReferenceId(classificationProvider.providerId);
    const documentId = input.documentId ?? String(input.attributes?.documentId ?? "unknown");
    const sessionId = input.sessionId ?? String(input.attributes?.sessionId ?? runtimeSessionId);

    let session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-document-classification-request",
        identity: {
          kind: "canonical-document-classification-identity",
          documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-document-classification-metadata",
          sessionId,
          tenantRef:
            input.tenantRef ??
            (input.attributes?.tenantId != null ? String(input.attributes.tenantId) : undefined),
          correlationId: input.correlationId,
          channel: "document-classification-runtime-classify",
          tags: ["class-01", "document-classification-runtime", "classify"],
        },
        reference: {
          kind: "canonical-document-classification-reference",
          captureRuntimeSessionId: input.captureRuntimeSessionId,
          ocrRuntimeSessionId: input.ocrRuntimeSessionId,
          providerReferenceId: input.preferredProviderReference ?? providerReferenceId,
        },
        configuration: {
          kind: "canonical-document-classification-configuration",
          preferredProviderReference: input.preferredProviderReference ?? providerReferenceId,
          contentTypeHint: input.contentType,
          languageHint: input.language,
          channel: "document-classification-runtime-classify",
          notes: "CLASS-01: classify via DocumentClassificationProviderPort (no AI).",
        },
        structuralNotes:
          "CLASS-01: Classification Runtime classify → DocumentClassificationProviderPort.classify().",
      },
      providerReferenceId,
      classificationProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      realClassificationExecuted: false,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "processing", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort();
        const execution = await orchestrator.startExecution({
          correlationId: input.correlationId,
          tenantRef: input.tenantRef,
          channel: "document-classification-runtime-classify",
          intakeRef: sessionId,
          documentRef: documentId,
          tags: ["class-01", "document-classification-runtime", "classify"],
          customAttributes: {
            source: "document-classification-runtime-classify",
            requestId: input.requestId ?? null,
            providerId: classificationProvider.providerId,
            adapterId: providerCaps.adapterId,
            captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
            ocrRuntimeSessionId: input.ocrRuntimeSessionId ?? null,
          },
          structuralNotes:
            "CLASS-01: Classification execution coordinated via Runtime → ProviderPort.",
        });
        if (execution.ok) {
          session = {
            ...session,
            executionId: execution.context?.executionId,
            updatedAt: nowIso(this.now),
          };
          this.store.setSession(session);
        }
      } catch {
        // Orchestrator best-effort — Classification Provider Port permanece obrigatório.
      }

      const processInput: DocumentClassificationProcessInput = {
        requestId: input.requestId,
        ocrText: input.ocrText,
        ocrStructuredData: input.ocrStructuredData,
        documentId,
        sessionId,
        contentType: input.contentType,
        language: input.language,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        rules: input.rules,
        attributes: {
          ...(input.attributes ?? {}),
          sessionId,
          documentId,
          tenantId: input.tenantRef ?? null,
          ocrRuntimeSessionId: input.ocrRuntimeSessionId ?? null,
          captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
        },
      };

      const providerResult = await classificationProvider.classify(processInput);

      session = {
        ...session,
        status: providerResult.ok ? "completed" : "failed",
        updatedAt: nowIso(this.now),
        message: providerResult.message,
        code: providerResult.code ?? (providerResult.ok ? "CLASSIFIED" : "CLASSIFICATION_FAILED"),
        realClassificationExecuted: true,
        documentType: providerResult.documentType,
        confidence: providerResult.confidence,
        matchedRules: providerResult.matchedRules,
        errors: providerResult.ok
          ? undefined
          : [providerResult.message ?? providerResult.code ?? "CLASSIFICATION_FAILED"],
      };
      this.store.setSession(session);

      return {
        kind: "canonical-document-classification-result",
        ok: providerResult.ok,
        runtimeSessionId,
        session,
        executionId: session.executionId,
        providerReferenceId,
        message: providerResult.message,
        code: session.code,
        realClassificationExecuted: true,
        documentType: providerResult.documentType,
        confidence: providerResult.confidence,
        matchedRules: providerResult.matchedRules,
        telemetry: providerResult.telemetry,
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
        realClassificationExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realClassificationExecuted: false,
      };
    }
  }

  async getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListDocumentClassificationRuntimeSessionsInput = {},
  ): Promise<ListDocumentClassificationRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES };
  }
}

function matchesList(
  session: CanonicalDocumentClassificationSession,
  input: ListDocumentClassificationRuntimeSessionsInput,
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
  if (
    input.captureRuntimeSessionId != null &&
    session.request.reference?.captureRuntimeSessionId !== input.captureRuntimeSessionId
  ) {
    return false;
  }
  if (
    input.ocrRuntimeSessionId != null &&
    session.request.reference?.ocrRuntimeSessionId !== input.ocrRuntimeSessionId
  ) {
    return false;
  }
  return true;
}
