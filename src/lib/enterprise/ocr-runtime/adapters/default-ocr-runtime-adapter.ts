/**
 * DefaultOCRRuntimeAdapter — adapter default (DIP-03 / OCR-01).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → OCRProviderPort → Adapter
 *
 * NÃO chama Azure/HTTP diretamente. Todo OCR real passa por OCRProviderPort.process().
 */
import type { OCRProcessInput } from "../../ocr-provider/ports/types";
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
  ProcessOCRInput,
  ProcessOCRResult,
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
    supportsProcess: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesOCRProviderAdapter: true,
    usesCaptureEngineRuntime: true,
    supportsPdf: true,
    supportsImage: true,
    supportsBatch: false,
    supportsStreaming: false,
    supportsHandwriting: true,
    supportsTables: true,
    supportsForms: false,
    supportsConfidenceScore: true,
    implementsRealOcr: true,
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

function toProviderReferenceId(
  providerId: string,
): ReturnType<typeof resolveStructuralProviderReference>["providerReferenceId"] {
  switch (providerId) {
    case "azure":
    case "google-vision":
    case "aws-textract":
    case "tesseract":
    case "mock":
      return providerId;
    case "test":
    case "default":
      return "mock";
    default:
      return "azure";
  }
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
    const providerId = this.enterpriseDeps.getOCRProviderPort().providerId;
    const realOcrAvailable = providerId === "azure" && ocrProviderHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      ocrProviderAdapterOk: ocrProviderHealth.ok,
      realOcrAvailable,
      message: ok
        ? "OCR Runtime pronto (Orchestrator + OCRProviderPort — sem bypass HTTP)."
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
        "azure",
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
        tags: ["ocr-01", "ocr-runtime", ...(input.metadata.tags ?? [])],
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
          "OCR-01: OCR coordinated via OCR Runtime (execution via process()/OCRProviderPort).",
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
          "OCR coordinated via OCR Runtime (Orchestrator + OCRProviderPort — execution via process()).",
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

  async process(input: ProcessOCRInput): Promise<ProcessOCRResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const ocrProvider = this.enterpriseDeps.getOCRProviderPort();
    const providerCaps = ocrProvider.capabilities();
    const providerReferenceId = toProviderReferenceId(ocrProvider.providerId);
    const documentId = input.documentId ?? input.documentIdentityReference?.documentId ?? "unknown";
    const sessionId = input.sessionId ?? String(input.attributes?.sessionId ?? runtimeSessionId);

    let session: CanonicalOCRSession = {
      kind: "canonical-ocr-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-ocr-request",
        identity: {
          kind: "canonical-ocr-identity",
          documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-ocr-metadata",
          sessionId,
          tenantRef:
            input.tenantRef ??
            (input.attributes?.tenantId != null ? String(input.attributes.tenantId) : undefined),
          correlationId: input.correlationId,
          channel: "ocr-runtime-process",
          tags: ["ocr-01", "ocr-runtime", "process"],
        },
        reference: {
          kind: "canonical-ocr-reference",
          storageKey: String(input.attributes?.storagePath ?? "") || undefined,
          captureRuntimeSessionId: input.captureRuntimeSessionId,
          providerReferenceId: input.preferredProviderReference ?? providerReferenceId,
        },
        configuration: {
          kind: "canonical-ocr-configuration",
          preferredProviderReference: input.preferredProviderReference ?? providerReferenceId,
          contentTypeHint: input.contentType,
          languageHint: input.language,
          channel: "ocr-runtime-process",
          notes: "OCR-01: process via OCRProviderPort (no direct Azure access).",
        },
        structuralNotes: "OCR-01: OCR Runtime process → OCRProviderPort.process().",
      },
      providerReferenceId,
      ocrProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      realOcrExecuted: false,
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
          channel: "ocr-runtime-process",
          intakeRef: sessionId,
          documentRef: documentId,
          tags: ["ocr-01", "ocr-runtime", "process"],
          customAttributes: {
            source: "ocr-runtime-process",
            requestId: input.requestId ?? null,
            providerId: ocrProvider.providerId,
            adapterId: providerCaps.adapterId,
            captureRuntimeSessionId: input.captureRuntimeSessionId ?? null,
          },
          structuralNotes: "OCR-01: OCR execution coordinated via OCR Runtime → OCRProviderPort.",
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
        // Orchestrator best-effort — OCR Provider Port permanece obrigatório.
      }

      const processInput: OCRProcessInput = {
        requestId: input.requestId,
        contentType: input.contentType,
        language: input.language,
        documentIdentityReference: input.documentIdentityReference ?? {
          documentId,
          kind: "document",
        },
        metadataReference: input.metadataReference,
        rawDataReference: input.rawDataReference,
        fileBytes: input.fileBytes,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        attributes: {
          ...(input.attributes ?? {}),
          sessionId,
          documentId,
          tenantId: input.tenantRef ?? null,
          storagePath: input.attributes?.storagePath ?? null,
        },
      };

      const providerResult = await ocrProvider.process(processInput);

      session = {
        ...session,
        status: providerResult.ok ? "completed" : "failed",
        updatedAt: nowIso(this.now),
        message: providerResult.message,
        code: providerResult.ok ? "OCR_PROCESSED" : "OCR_PROVIDER_FAILED",
        errors: providerResult.ok ? undefined : [providerResult.message ?? "OCR_PROVIDER_FAILED"],
        realOcrExecuted: providerResult.simulated !== true,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-ocr-result",
        ok: providerResult.ok,
        runtimeSessionId,
        session,
        executionId: session.executionId,
        providerReferenceId,
        message: providerResult.message,
        code: session.code,
        realOcrExecuted: session.realOcrExecuted,
        processing: providerResult.processing,
        output: providerResult.output,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_PROCESS_ERROR",
        errors: [message],
        realOcrExecuted: false,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ocr-result",
        ok: false,
        runtimeSessionId,
        session,
        providerReferenceId,
        message,
        code: "RUNTIME_PROCESS_ERROR",
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
