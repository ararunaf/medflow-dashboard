/**
 * DefaultDocumentClassificationRuntimeAdapter — adapter default (DIP-04).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → OCR Runtime (hop anterior)
 *   → Classification Provider Adapter (referência estrutural apenas)
 *
 * NÃO executa classificação. NÃO usa IA/LLM/ML/embeddings.
 * NÃO usa OCR para classificação. NÃO aplica regras ou heurísticas.
 * NÃO identifica automaticamente tipos documentais.
 * NÃO conecta Classification Providers externos.
 */
import { createDocumentClassificationRuntimeSessionId } from "../ports/identity";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import type {
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

/** Referência estrutural ao Classification Provider Adapter (sem Port de execução). */
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
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesOCRRuntime: true,
    usesCaptureEngineRuntime: true,
    supportsMedicalGuideClassification: false,
    supportsInvoiceClassification: false,
    supportsContractClassification: false,
    supportsBatchClassification: false,
    supportsConfidenceScore: false,
    supportsMultiLabelClassification: false,
    supportsCustomModels: false,
    supportsRuleBasedClassification: false,
    implementsRealClassification: false,
    implementsAi: false,
    implementsMachineLearning: false,
    implementsRuleEngine: false,
    implementsEmbeddings: false,
    implementsLlm: false,
    implementsOcrForClassification: false,
  };
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
          "(Orchestrator + OCRRuntimePort). Implementação paralela é proibida.",
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
        realClassificationAvailable: false,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, ocrRuntimeHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getOCRRuntimePort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && ocrRuntimeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      ocrRuntimeOk: ocrRuntimeHealth.ok,
      realClassificationAvailable: false,
      message: ok
        ? "Document Classification Runtime pronto (Orchestrator + OCR Runtime — sem classificação real)."
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

    const providerReference = resolveStructuralClassificationProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "mock",
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
        tags: ["dip-04", "document-classification-runtime", ...(input.metadata.tags ?? [])],
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
          "DIP-04: Classification coordinated structurally via Document Classification Runtime (no real classification).",
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

      // Hop estrutural OCR Runtime — health/capabilities apenas.
      // PROIBIDO: classificação / IA / ML / embeddings / LLM / regras / heurísticas nesta sprint.
      const ocrRuntime = this.enterpriseDeps.getOCRRuntimePort();
      const ocrCaps = ocrRuntime.capabilities();
      const ocrHealth = await ocrRuntime.health();

      if (!ocrHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          classificationProviderAdapterId: STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
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

      // Classification Provider Adapter — referência estrutural apenas (health/capabilities simbólicos).
      // PROIBIDO: classify / predict / embeddings / LLM / HTTP / credenciais nesta sprint.
      // OCR Runtime capabilities consultadas estruturalmente (implementsRealOcr permanece false).

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        classificationProviderAdapterId: STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
        updatedAt: nowIso(this.now),
        message:
          "Classification coordinated structurally via Document Classification Runtime " +
          `(Orchestrator + OCR Runtime adapter=${ocrCaps.adapterId} + ` +
          "Classification Provider Adapter reference — no real classification).",
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
