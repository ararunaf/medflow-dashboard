/**
 * DefaultXMLTISSRuntimeAdapter — C-01 / ECS-01.
 *
 * Adapter oficial do Enterprise XML TISS Runtime.
 * Responde estruturalmente (prepareXMLDocument/getResult/stats) sem
 * depender de Ports Enterprise.
 *
 * Sem geração de XML. Sem serialização. Sem parser. Sem XSD. Sem SOAP.
 * Sem banco. Sem persistência.
 */
import {
  DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  toXMLCapabilities,
} from "../ports/capabilities";
import {
  XML_TISS_RUNTIME_IDENTITY,
  createXMLBodyId,
  createXMLDocumentId,
  createXMLHeaderId,
  createXMLMetadataId,
  createXMLResultId,
  createXMLTISSRuntimeRequestId,
} from "../ports/identity";
import type { XMLTISSRuntimePort } from "../ports/xml-tiss-runtime-port";
import type { XMLDocument, XMLResult } from "../ports/canonical";
import { createDisabledXMLTISSVersion } from "../ports/canonical";
import type {
  XMLTISSRuntimeCapabilities,
  XMLTISSRuntimeEnterpriseDeps,
  XMLTISSRuntimeHealth,
  XMLTISSRuntimeInfo,
  XMLTISSRuntimeOperationalControls,
  XMLTISSRuntimeOperationEnvelope,
  XMLTISSRuntimeProviderId,
  XMLTISSRuntimeProviderMetadata,
  XMLTISSRuntimeStructuredLog,
  XMLStatsInput,
  XMLStatsResult,
  GetXMLResultInput,
  GetXMLResultResult,
  PrepareXMLDocumentInput,
  PrepareXMLDocumentResult,
} from "../ports/types";
import { InMemoryXMLTISSRuntimeStore, type XMLTISSRuntimeStore } from "../store";

export const DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID = "default-enterprise-xml-tiss-runtime";
export const DEFAULT_XML_TISS_RUNTIME_VERSION = XML_TISS_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLTISSRuntimeAdapterOptions = {
  provider?: Extract<XMLTISSRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLTISSRuntimeStore;
  enterpriseDeps?: XMLTISSRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: XMLTISSRuntimeOperationalControls): AbortSignal | undefined {
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
    xmlGenerationImplemented: false,
    xmlSerializationImplemented: false,
    xmlParsingImplemented: false,
    xmlValidationImplemented: false,
    xmlSigningImplemented: false,
    xmlCompressionImplemented: false,
    batchXmlGenerationImplemented: false,
    soapIntegrationImplemented: false,
    operatorIntegrationImplemented: false,
    schemaValidationImplemented: false,
  } as const;
}

/**
 * Adapter oficial C-01 — XML TISS Runtime default / enterprise.
 */
export class DefaultXMLTISSRuntimeAdapter implements XMLTISSRuntimePort {
  readonly providerId: Extract<XMLTISSRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLTISSRuntimeProviderMetadata;
  private readonly store: XMLTISSRuntimeStore;
  private readonly enterpriseDeps: XMLTISSRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultXMLTISSRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML TISS Runtime ready (structural only — no functional XML generation).`;
    this.metadata = {
      name:
        this.providerId === "default" ? "Default XML TISS Runtime" : XML_TISS_RUNTIME_IDENTITY.name,
      version: DEFAULT_XML_TISS_RUNTIME_VERSION,
      vendor: XML_TISS_RUNTIME_IDENTITY.vendor,
      layer: XML_TISS_RUNTIME_IDENTITY.layer,
      vendorAgnostic: XML_TISS_RUNTIME_IDENTITY.vendorAgnostic,
      description: XML_TISS_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryXMLTISSRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLTISSRuntimeStore {
    return this.store;
  }

  capabilities(): XMLTISSRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsPrepareXMLDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalXMLTISS: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toXMLCapabilities(DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): XMLTISSRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_TISS_RUNTIME",
      capabilities: { ...DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<XMLTISSRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // C-01 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let qualityRuntimeOk = true;
    let autoFillRuntimeOk = true;
    let tissMappingRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;
    let documentExtractionRuntimeOk = true;
    let documentClassificationRuntimeOk = true;
    let ocrRuntimeOk = true;
    let aiOrchestrationRuntimeOk = true;
    let intelligentCaptureRuntimeOk = true;
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;

    if (typeof this.enterpriseDeps.getQualityRuntimePort === "function") {
      qualityRuntimeOk = portShapeOk(this.enterpriseDeps.getQualityRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAutoFillRuntimePort === "function") {
      autoFillRuntimeOk = portShapeOk(this.enterpriseDeps.getAutoFillRuntimePort());
    }
    if (typeof this.enterpriseDeps.getTISSMappingRuntimePort === "function") {
      tissMappingRuntimeOk = portShapeOk(this.enterpriseDeps.getTISSMappingRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAuditRuntimePort === "function") {
      auditRuntimeOk = portShapeOk(this.enterpriseDeps.getAuditRuntimePort());
    }
    if (typeof this.enterpriseDeps.getValidationRuntimePort === "function") {
      validationRuntimeOk = portShapeOk(this.enterpriseDeps.getValidationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getDocumentExtractionRuntimePort === "function") {
      documentExtractionRuntimeOk = portShapeOk(
        this.enterpriseDeps.getDocumentExtractionRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getDocumentClassificationRuntimePort === "function") {
      documentClassificationRuntimeOk = portShapeOk(
        this.enterpriseDeps.getDocumentClassificationRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
      ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
    }
    if (typeof this.enterpriseDeps.getAIOrchestrationRuntimePort === "function") {
      aiOrchestrationRuntimeOk = portShapeOk(this.enterpriseDeps.getAIOrchestrationRuntimePort());
    }
    if (typeof this.enterpriseDeps.getIntelligentCaptureRuntimePort === "function") {
      intelligentCaptureRuntimeOk = portShapeOk(
        this.enterpriseDeps.getIntelligentCaptureRuntimePort(),
      );
    }
    if (typeof this.enterpriseDeps.getScannerRuntimePort === "function") {
      scannerRuntimeOk = portShapeOk(this.enterpriseDeps.getScannerRuntimePort());
    }
    if (typeof this.enterpriseDeps.getWatchFolderRuntimePort === "function") {
      watchFolderRuntimeOk = portShapeOk(this.enterpriseDeps.getWatchFolderRuntimePort());
    }
    if (typeof this.enterpriseDeps.getUploadRuntimePort === "function") {
      uploadRuntimeOk = portShapeOk(this.enterpriseDeps.getUploadRuntimePort());
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      qualityRuntimeOk &&
      autoFillRuntimeOk &&
      tissMappingRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk &&
      documentExtractionRuntimeOk &&
      documentClassificationRuntimeOk &&
      ocrRuntimeOk &&
      aiOrchestrationRuntimeOk &&
      intelligentCaptureRuntimeOk &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      uploadRuntimeOk;

    return {
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      qualityRuntimeOk,
      autoFillRuntimeOk,
      tissMappingRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      documentExtractionRuntimeOk,
      documentClassificationRuntimeOk,
      ocrRuntimeOk,
      aiOrchestrationRuntimeOk,
      intelligentCaptureRuntimeOk,
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      uploadRuntimeOk,
      storedDocumentCount: this.store.documentCount(),
      storedResultCount: this.store.resultCount(),
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? ok
          ? "XML TISS Runtime pronto (estrutural C-01 — sem geração de XML)."
          : "XML TISS Runtime degradado — ver Ports Enterprise."
        : "XML TISS Runtime unhealthy.",
    };
  }

  async prepareXMLDocument(input: PrepareXMLDocumentInput): Promise<PrepareXMLDocumentResult> {
    return this.runOperation("prepareXMLDocument", input, async () => {
      const stamp = nowIso(this.now);
      const documentId = input.documentId ?? createXMLDocumentId();
      const existing = this.store.getDocument(documentId);
      if (existing) {
        return {
          ok: false,
          code: "XML_TISS_RUNTIME_DOCUMENT_ALREADY_PREPARED",
          message: "XML TISS document already prepared.",
          document: existing,
        };
      }
      const xmlContext = input.xmlContext ?? {
        kind: "canonical-xml-tiss-context" as const,
        documentId,
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        qualityAssessment: input.qualityAssessment,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      };
      const header = input.header ?? {
        kind: "canonical-xml-tiss-header" as const,
        headerId: createXMLHeaderId(),
        status: "prepared" as const,
        tissVersion: input.tissVersion ?? createDisabledXMLTISSVersion(),
        xmlGenerationImplemented: false as const,
        xmlSerializationImplemented: false as const,
      };
      const body = input.body ?? {
        kind: "canonical-xml-tiss-body" as const,
        bodyId: createXMLBodyId(),
        guideType: input.guide?.guideType,
        status: "prepared" as const,
        xmlGenerationImplemented: false as const,
        xmlSerializationImplemented: false as const,
      };
      const metadata = input.metadata ?? {
        kind: "canonical-xml-tiss-metadata" as const,
        metadataId: createXMLMetadataId(),
        documentId,
        guideType: input.guide?.guideType,
        tissVersion: input.tissVersion ?? createDisabledXMLTISSVersion(),
        status: "prepared" as const,
        xmlGenerationImplemented: false as const,
        xmlSerializationImplemented: false as const,
        xmlParsingImplemented: false as const,
        schemaValidationImplemented: false as const,
      };
      const document: XMLDocument = {
        kind: "canonical-xml-tiss-document",
        documentId,
        status: "prepared",
        xmlContext,
        header,
        body,
        guide: input.guide,
        batch: input.batch,
        metadata,
        tissVersion: input.tissVersion ?? createDisabledXMLTISSVersion(),
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        qualityAssessment: input.qualityAssessment,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setDocument(document);
      const result = this.buildResult({
        operation: "prepareXMLDocument",
        status: "prepared",
        document,
        stamp,
        code: "XML_TISS_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical XML TISS Runtime structural prepareXMLDocument (C-01 foundation — no functional XML generation).",
        xmlContext,
        guide: input.guide,
        batch: input.batch,
        header,
        body,
        metadata,
        canonicalGuide: input.canonicalGuide,
        mappingResult: input.mappingResult,
        autoFillResult: input.autoFillResult,
        qualityAssessment: input.qualityAssessment,
        validationResult: input.validationResult,
        auditResult: input.auditResult,
        aiOrchestrationContext: input.aiOrchestrationContext,
      });
      this.store.setResult(result);
      return {
        ok: true,
        result,
        document,
        code: "XML_TISS_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async getResult(input: GetXMLResultInput): Promise<GetXMLResultResult> {
    return this.runOperation("getResult", input, async () => {
      const document = input.documentId ? this.store.getDocument(input.documentId) : undefined;
      const storedResult = input.resultId ? this.store.getResult(input.resultId) : undefined;
      if (!document && !storedResult) {
        return {
          ok: false,
          code: "XML_TISS_RUNTIME_RESULT_NOT_FOUND",
          message: "Canonical XML TISS document/result not found.",
        };
      }
      const stamp = nowIso(this.now);
      const result =
        storedResult ??
        this.buildResult({
          operation: "getResult",
          status: document?.status ?? "processed",
          document,
          stamp,
          code: "XML_TISS_RUNTIME_STRUCTURAL_OK",
          messageText:
            "Canonical XML TISS Runtime structural getResult (C-01 foundation — no functional XML generation).",
          xmlContext: document?.xmlContext,
          guide: document?.guide,
          batch: document?.batch,
          header: document?.header,
          body: document?.body,
          metadata: document?.metadata,
          canonicalGuide: document?.canonicalGuide,
          mappingResult: document?.mappingResult,
          autoFillResult: document?.autoFillResult,
          qualityAssessment: document?.qualityAssessment,
          validationResult: document?.validationResult,
          auditResult: document?.auditResult,
          aiOrchestrationContext: document?.aiOrchestrationContext,
        });
      if (!storedResult) {
        this.store.setResult(result);
      }
      return {
        ok: true,
        result,
        document: document ?? storedResult?.document,
        code: "XML_TISS_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: XMLStatsInput = {}): Promise<XMLStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "XML_TISS_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical XML TISS Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "XML_TISS_RUNTIME_OK",
        message: `XML TISS Runtime stats: ${statistics.totalDocuments} documents, ${statistics.totalResults} results.`,
      };
    });
  }

  private buildResult(args: {
    operation: XMLResult["operation"];
    status: XMLResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    document?: XMLDocument;
    xmlContext?: XMLResult["xmlContext"];
    guide?: XMLResult["guide"];
    batch?: XMLResult["batch"];
    header?: XMLResult["header"];
    body?: XMLResult["body"];
    metadata?: XMLResult["metadata"];
    canonicalGuide?: XMLResult["canonicalGuide"];
    mappingResult?: XMLResult["mappingResult"];
    autoFillResult?: XMLResult["autoFillResult"];
    qualityAssessment?: XMLResult["qualityAssessment"];
    validationResult?: XMLResult["validationResult"];
    auditResult?: XMLResult["auditResult"];
    aiOrchestrationContext?: XMLResult["aiOrchestrationContext"];
  }): XMLResult {
    return {
      kind: "canonical-xml-tiss-result",
      ok: true,
      resultId: createXMLResultId(),
      operation: args.operation,
      document: args.document,
      guide: args.guide,
      batch: args.batch,
      header: args.header,
      body: args.body,
      metadata: args.metadata,
      xmlContext: args.xmlContext,
      canonicalGuide: args.canonicalGuide,
      mappingResult: args.mappingResult,
      autoFillResult: args.autoFillResult,
      qualityAssessment: args.qualityAssessment,
      validationResult: args.validationResult,
      auditResult: args.auditResult,
      aiOrchestrationContext: args.aiOrchestrationContext,
      ...structuralFlags(),
      runtimeReady: true,
      status: args.status,
      messageText: args.messageText,
      code: args.code,
      createdAt: args.stamp,
      updatedAt: args.stamp,
    };
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLTISSRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLTISSRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLTISSRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLTISSRuntimeStructuredLog[] = [];
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
            code: "XML_TISS_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLTISSRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "XML_TISS_RUNTIME_RETRY",
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
              reject(new Error("XML TISS Runtime operation timed out."));
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
        code: "XML_TISS_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error ? lastError.message : "XML TISS Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLTISSRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message = error instanceof Error ? error.message : "XML TISS Runtime operation failed.";
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "XML_TISS_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLTISSRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-01). */
export const EnterpriseXMLTISSRuntimeAdapter = DefaultXMLTISSRuntimeAdapter;
