/**
 * DefaultOCRRuntimeAdapter — adapter default (DIP-03).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → OCR Provider Adapter (estrutural)
 *
 * NÃO executa OCR. NÃO invoca extração no OCR Provider Adapter.
 * NÃO conecta Azure / Google Vision / Textract / Tesseract.
 * NÃO extrai texto. NÃO interpreta documentos.
 */
import { createOCRRuntimeSessionId } from "../ports/identity";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { CanonicalOCRSession } from "../ports/models";
import type {
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
} from "../ports/types";
import {
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  resolveStructuralProviderReference,
} from "../ports/types";
import { InMemoryOCRRuntimeStore, type OCRRuntimeStore } from "../store";

export const DEFAULT_OCR_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

export type DefaultOCRRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: OCRRuntimeEnterpriseDeps;
  store?: OCRRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): OCRRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_OCR_RUNTIME_ADAPTER_ID,
    supportsCoordinateOcr: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesOCRProviderAdapter: true,
    usesCaptureEngineRuntime: true,
    supportsPdf: false,
    supportsImage: false,
    supportsBatch: false,
    supportsStreaming: false,
    supportsHandwriting: false,
    supportsTables: false,
    supportsForms: false,
    supportsConfidenceScore: false,
    implementsRealOcr: false,
    implementsAzure: false,
    implementsGoogleVision: false,
    implementsAwsTextract: false,
    implementsTesseract: false,
    implementsAi: false,
    implementsClassification: false,
    implementsXml: false,
    implementsTiss: false,
  };
}

export class DefaultOCRRuntimeAdapter implements OCRRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: OCRRuntimeEnterpriseDeps;
  private readonly store: OCRRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultOCRRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultOCRRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + OCRProviderPort). Implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryOCRRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createOCRRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): OCRRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<OCRRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
        realOcrAvailable: false,
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, ocrProviderHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getOCRProviderPort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && ocrProviderHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      ocrProviderAdapterOk: ocrProviderHealth.ok,
      realOcrAvailable: false,
      message: ok
        ? "OCR Runtime pronto (Orchestrator + OCR Provider Adapter estrutural — sem OCR real)."
        : "OCR Runtime degradado — ver Ports Enterprise.",
    };
  }

  async coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-ocr-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realOcrExecuted: false,
      };
    }

    const providerReference = resolveStructuralProviderReference(
      input.configuration?.preferredProviderReference ??
        input.reference?.providerReferenceId ??
        "mock",
    );

    let session: CanonicalOCRSession = {
      kind: "canonical-ocr-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      realOcrExecuted: false,
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
      const channel = input.configuration?.channel ?? input.metadata.channel ?? "ocr-runtime";

      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel,
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["dip-03", "ocr-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: "ocr-runtime-coordination",
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          providerReferenceId: providerReference.providerReferenceId,
          captureRuntimeSessionId: input.reference?.captureRuntimeSessionId ?? null,
          realOcrExecuted: false,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "DIP-03: OCR coordinated structurally via OCR Runtime (no real OCR).",
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
          realOcrExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ocr-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realOcrExecuted: false,
        };
      }

      // Referência estrutural ao OCR Provider Adapter — health/capabilities apenas.
      // PROIBIDO: extração / HTTP / credenciais / OCR real nesta sprint.
      const ocrProvider = this.enterpriseDeps.getOCRProviderPort();
      const providerCaps = ocrProvider.capabilities();
      const providerHealth = await ocrProvider.health();

      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          ocrProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "OCR Provider Adapter health falhou.",
          code: "OCR_PROVIDER_ADAPTER_UNHEALTHY",
          errors: [providerHealth.message ?? "OCR_PROVIDER_ADAPTER_UNHEALTHY"],
          realOcrExecuted: false,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ocr-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          realOcrExecuted: false,
        };
      }

      session = {
        ...session,
        status: "coordinated",
        executionId: execution.context?.executionId,
        ocrProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "OCR coordinated structurally via OCR Runtime (Orchestrator + Provider Adapter — no real OCR).",
        code: "COORDINATED",
        realOcrExecuted: false,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-ocr-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        realOcrExecuted: false,
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
        realOcrExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ocr-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        realOcrExecuted: false,
      };
    }
  }

  async getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListOCRRuntimeSessionsInput = {},
  ): Promise<ListOCRRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListOCRProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_OCR_PROVIDER_REFERENCES };
  }
}

function matchesList(session: CanonicalOCRSession, input: ListOCRRuntimeSessionsInput): boolean {
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
  return true;
}
