/**
 * DefaultXMLValidationRuntimeAdapter — C-02 / D-02.
 *
 * Adapter oficial do Enterprise XML Validation Runtime.
 * C-02: responde estruturalmente (validate/getResult/listResults/stats).
 * D-02: capability funcional XSD Validation (`validateXsd`).
 *
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
import {
  DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  toXMLValidationCapabilities,
} from "../ports/capabilities";
import {
  XML_VALIDATION_RUNTIME_IDENTITY,
  createXMLValidationId,
  createXMLValidationResultId,
  createXMLValidationRuntimeRequestId,
} from "../ports/identity";
import type { XMLValidationRuntimePort } from "../ports/xml-validation-runtime-port";
import type {
  XMLValidationContext,
  XMLValidationRequest,
  XMLValidationResult,
  XMLValidationSummary,
} from "../ports/canonical";
import type {
  GetXMLValidationResultInput,
  GetXMLValidationResultResult,
  ListXMLValidationResultsInput,
  ListXMLValidationResultsResult,
  ValidateNamespaceInput,
  ValidateNamespaceResult,
  ValidateVersionInput,
  ValidateVersionResult,
  ValidateXMLInput,
  ValidateXMLResult,
  ValidateXSDInput,
  ValidateXSDResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeEnterpriseDeps,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeOperationalControls,
  XMLValidationRuntimeOperationEnvelope,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationRuntimeStructuredLog,
  XMLValidationStatsInput,
  XMLValidationStatsResult,
} from "../ports/types";
import { InMemoryXMLValidationRuntimeStore, type XMLValidationRuntimeStore } from "../store";
import { NamespaceValidator } from "../namespace-validation/namespace-validator";
import { VersionValidator } from "../version-validation/version-validator";
import { XSDValidator } from "../xsd-validation/xsd-validator";

export const DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID =
  "default-enterprise-xml-validation-runtime";
/** Alias TISS-08. */
export const DEFAULT_XML_VALIDATION_ADAPTER_ID = DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID;
export const DEFAULT_XML_VALIDATION_RUNTIME_VERSION = XML_VALIDATION_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultXMLValidationRuntimeAdapterOptions = {
  provider?: Extract<XMLValidationRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: XMLValidationRuntimeStore;
  enterpriseDeps?: XMLValidationRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

/** Alias TISS-08. */
export type DefaultXMLValidationAdapterOptions = DefaultXMLValidationRuntimeAdapterOptions;

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function readSignal(input: XMLValidationRuntimeOperationalControls): AbortSignal | undefined {
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
    xmlValidationImplemented: false,
    xsdValidationImplemented: true,
    /** D-04 — Namespace Validation funcional. */
    namespaceValidationImplemented: true,
    schemaSelectionImplemented: false,
    /** D-05 — Version Validation funcional. */
    versionValidationImplemented: true,
    businessValidationImplemented: false,
    operatorValidationImplemented: false,
    xmlRepairImplemented: false,
    automaticCorrectionImplemented: false,
    validationReportImplemented: false,
  } as const;
}

function resolveContext(input: ValidateXMLInput, documentId?: string): XMLValidationContext {
  return (
    input.xmlContext ?? {
      kind: "canonical-xml-validation-context" as const,
      documentId: documentId ?? input.documentId,
      xmlDocument: input.xmlDocument,
      canonicalGuide: input.canonicalGuide,
      mappingResult: input.mappingResult,
      qualityAssessment: input.qualityAssessment,
      validationResult: input.validationResult,
      auditResult: input.auditResult,
      autoFillResult: input.autoFillResult,
      structuralNotes: input.request?.structuralNotes,
    }
  );
}

function resolveRequest(input: ValidateXMLInput): XMLValidationRequest {
  const base = input.request ?? {
    kind: "canonical-xml-validation-request" as const,
  };
  const documentId = base.documentId ?? input.documentId;
  const xmlContext = resolveContext(input, documentId);
  return {
    ...base,
    kind: "canonical-xml-validation-request",
    requestId: base.requestId ?? input.requestId,
    validationId: base.validationId ?? input.validationId,
    name: base.name ?? input.name,
    schemaResultId: base.schemaResultId ?? input.schemaResultId,
    serializeResultId: base.serializeResultId ?? input.serializeResultId,
    generationResultId: base.generationResultId ?? input.generationResultId,
    documentId,
    operation: base.operation ?? "validate",
    xmlContext,
    xmlDocument: base.xmlDocument ?? input.xmlDocument,
    canonicalGuide: base.canonicalGuide ?? input.canonicalGuide,
    mappingResult: base.mappingResult ?? input.mappingResult,
    qualityAssessment: base.qualityAssessment ?? input.qualityAssessment,
    validationResult: base.validationResult ?? input.validationResult,
    auditResult: base.auditResult ?? input.auditResult,
    autoFillResult: base.autoFillResult ?? input.autoFillResult,
  };
}

function resolveSummary(): XMLValidationSummary {
  return {
    kind: "canonical-xml-validation-summary",
    issueCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    notes: "C-02 foundation — structural response only; no real XML/XSD validation.",
  };
}

/**
 * Adapter oficial C-02 — XML Validation Runtime default / enterprise.
 */
export class DefaultXMLValidationRuntimeAdapter implements XMLValidationRuntimePort {
  readonly providerId: Extract<XMLValidationRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: XMLValidationRuntimeProviderMetadata;
  private readonly store: XMLValidationRuntimeStore;
  private readonly enterpriseDeps: XMLValidationRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now?: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;
  private readonly xsdValidator: XSDValidator;
  private readonly namespaceValidator: NamespaceValidator;
  private readonly versionValidator: VersionValidator;

  constructor(options: DefaultXMLValidationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} XML Validation Runtime ready (C-02 structural + D-02 XSD Validation).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default XML Validation Runtime"
          : XML_VALIDATION_RUNTIME_IDENTITY.name,
      version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
      vendor: XML_VALIDATION_RUNTIME_IDENTITY.vendor,
      layer: XML_VALIDATION_RUNTIME_IDENTITY.layer,
      vendorAgnostic: XML_VALIDATION_RUNTIME_IDENTITY.vendorAgnostic,
      description:
        "C-02 structural foundation + D-02 XSD Validation functional capability (no TISS/operator knowledge).",
    };
    this.store = options.store ?? new InMemoryXMLValidationRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
    this.xsdValidator = new XSDValidator();
    this.namespaceValidator = new NamespaceValidator();
    this.versionValidator = new VersionValidator();
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): XMLValidationRuntimeStore {
    return this.store;
  }

  capabilities(): XMLValidationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsValidate: true,
      supportsGetResult: true,
      supportsListResults: true,
      supportsStats: true,
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesXMLTISSRuntimePort: true,
      usesQualityRuntimePort: true,
      usesAutoFillRuntimePort: true,
      usesTISSMappingRuntimePort: true,
      usesAuditRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesAIOrchestrationRuntimePort: true,
      validationEngineReady: true,
      runtimeReady: true,
      ...structuralFlags(),
      implementsOfficialXsd: false,
      implementsXsdValidation: true,
      implementsRealXmlValidation: false,
      implementsOfficialTissValidation: false,
      implementsOfficialAnsValidation: false,
      implementsOperatorDispatch: false,
      implementsBusinessRules: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
      engine: { ...DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toXMLValidationCapabilities(DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): XMLValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "XML_VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<XMLValidationRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const storeHealth = this.store.health();

    // C-02 — peers estruturais: valida Port shape sem chamar health() (evita ciclos).
    let xmlTissRuntimeOk = true;
    let qualityRuntimeOk = true;
    let autoFillRuntimeOk = true;
    let tissMappingRuntimeOk = true;
    let auditRuntimeOk = true;
    let validationRuntimeOk = true;
    let documentExtractionRuntimeOk = true;
    let documentClassificationRuntimeOk = true;
    let ocrRuntimeOk = true;
    let aiOrchestrationRuntimeOk = true;

    if (typeof this.enterpriseDeps.getXMLTISSRuntimePort === "function") {
      xmlTissRuntimeOk = portShapeOk(this.enterpriseDeps.getXMLTISSRuntimePort());
    }
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

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      this.healthy &&
      storeHealth.ok &&
      xmlTissRuntimeOk &&
      qualityRuntimeOk &&
      autoFillRuntimeOk &&
      tissMappingRuntimeOk &&
      auditRuntimeOk &&
      validationRuntimeOk &&
      documentExtractionRuntimeOk &&
      documentClassificationRuntimeOk &&
      ocrRuntimeOk &&
      aiOrchestrationRuntimeOk;

    return {
      kind: "canonical-xml-validation-health",
      ok,
      provider: this.providerId,
      latencyMs: Math.max(0, Math.round(end - start)),
      status: ok ? "ready" : "unhealthy",
      xmlTissRuntimeOk,
      qualityRuntimeOk,
      autoFillRuntimeOk,
      tissMappingRuntimeOk,
      auditRuntimeOk,
      validationRuntimeOk,
      documentExtractionRuntimeOk,
      documentClassificationRuntimeOk,
      ocrRuntimeOk,
      aiOrchestrationRuntimeOk,
      storedResultCount: this.store.resultCount(),
      storedRequestCount: this.store.requestCount(),
      storedContextCount: this.store.contextCount(),
      validationEngineReady: true,
      runtimeReady: true,
      ...structuralFlags(),
      xsdValidationOk: this.healthy === true,
      namespaceValidationOk: this.healthy === true,
      versionValidationOk: this.healthy === true,
      message: this.healthy
        ? ok
          ? "XML Validation Runtime pronto (C-02 estrutural + D-02 XSD Validation)."
          : "XML Validation Runtime degradado — ver Ports Enterprise."
        : "XML Validation Runtime unhealthy.",
    };
  }

  async validateXsd(input: ValidateXSDInput): Promise<ValidateXSDResult> {
    return this.runOperation("validateXsd", input, async () => {
      const validation = this.xsdValidator.validate(input.document, input.xsd, {
        rootElementName: input.rootElementName,
      });
      return {
        ok: validation.ok,
        validation,
        context: validation.context ?? null,
        valid: validation.valid,
        code: validation.code,
        message: validation.message,
      };
    });
  }

  // -------------------------------------------------------------------------
  // D-04 — Namespace Validation funcional.
  // -------------------------------------------------------------------------

  async validateNamespace(input: ValidateNamespaceInput): Promise<ValidateNamespaceResult> {
    return this.runOperation("validateNamespace", input, async () => {
      const validation = this.namespaceValidator.validate(input.document, {
        namespaceUri: input.namespaceUri,
        prefix: input.prefix,
        rootElementName: input.rootElementName,
      });
      return {
        ok: validation.ok,
        validation,
        context: validation.context ?? null,
        valid: validation.valid,
        code: validation.code,
        message: validation.message,
      };
    });
  }

  // -------------------------------------------------------------------------
  // D-05 — Version Validation funcional.
  // -------------------------------------------------------------------------

  async validateVersion(input: ValidateVersionInput): Promise<ValidateVersionResult> {
    return this.runOperation("validateVersion", input, async () => {
      const validation = this.versionValidator.validate(input.document, {
        versionId: input.versionId,
        attributeName: input.attributeName,
        rootElementName: input.rootElementName,
      });
      return {
        ok: validation.ok,
        validation,
        context: validation.context ?? null,
        valid: validation.valid,
        code: validation.code,
        message: validation.message,
      };
    });
  }

  async validate(input: ValidateXMLInput): Promise<ValidateXMLResult> {
    return this.runOperation("validate", input, async () => {
      const request = resolveRequest(input);
      const stamp = nowIso(this.now);
      const resultId = createXMLValidationResultId();
      const validationId = request.validationId ?? createXMLValidationId();
      const profile = request.profile ?? {
        kind: "canonical-xml-validation-profile" as const,
        profileCode: "canonical-foundation",
        label: "Canonical XML Validation Foundation Profile",
        notes: "C-02 structural profile only — no ANS/TISS official validation.",
      };
      const finalRequest: XMLValidationRequest = { ...request, validationId };
      this.store.setRequest(finalRequest);

      const result: XMLValidationResult = {
        kind: "canonical-xml-validation-result",
        ok: true,
        resultId,
        request: finalRequest,
        profile,
        metadata: finalRequest.metadata,
        operation: "validate",
        issues: [],
        summary: resolveSummary(),
        schemaResultId: finalRequest.schemaResultId,
        serializeResultId: finalRequest.serializeResultId,
        generationResultId: finalRequest.generationResultId,
        xmlContext: finalRequest.xmlContext,
        xmlDocument: finalRequest.xmlDocument,
        canonicalGuide: finalRequest.canonicalGuide,
        mappingResult: finalRequest.mappingResult,
        qualityAssessment: finalRequest.qualityAssessment,
        validationResult: finalRequest.validationResult,
        auditResult: finalRequest.auditResult,
        autoFillResult: finalRequest.autoFillResult,
        validationExecuted: false,
        realValidationPerformed: false,
        officialXsdLoaded: false,
        officialAnsValidation: false,
        officialTissValidation: false,
        validationRulesLoaded: false,
        validationEngineReady: true,
        runtimeReady: true,
        ...structuralFlags(),
        status: "validated",
        message:
          "Canonical XML validation structural response (C-02 foundation — no official XSD / no real validation).",
        code: "XML_VALIDATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      this.store.setResult(result);
      if (finalRequest.xmlContext) {
        this.store.setContext(finalRequest.xmlContext);
      }

      return {
        ok: true,
        result,
        code: "XML_VALIDATION_RUNTIME_OK",
        message: result.message,
      };
    });
  }

  async getResult(input: GetXMLValidationResultInput): Promise<GetXMLValidationResultResult> {
    return this.runOperation("getResult", input, async () => {
      const result = this.store.getResult(input.resultId);
      if (!result) {
        return {
          ok: false,
          code: "XML_VALIDATION_RUNTIME_NOT_FOUND",
          message: "Canonical XML validation result not found.",
        };
      }
      return {
        ok: true,
        result,
        code: "XML_VALIDATION_RUNTIME_OK",
        message: "Canonical XML validation result loaded.",
      };
    });
  }

  async listResults(
    input: ListXMLValidationResultsInput = {},
  ): Promise<ListXMLValidationResultsResult> {
    return this.runOperation("listResults", input, async () => {
      let results = this.store.listResults();
      if (input.status != null) {
        results = results.filter((r) => r.status === input.status);
      }
      return {
        ok: true,
        results,
        statistics: this.store.statistics(),
        code: "XML_VALIDATION_RUNTIME_OK",
        message: `Listed ${results.length} canonical XML validation results.`,
      };
    });
  }

  async stats(input: XMLValidationStatsInput = {}): Promise<XMLValidationStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = nowIso(this.now);
      const result: XMLValidationResult = {
        kind: "canonical-xml-validation-result",
        ok: true,
        resultId: createXMLValidationResultId(),
        request: {
          kind: "canonical-xml-validation-request",
          documentId: input.documentId,
          operation: "stats",
        },
        operation: "stats",
        issues: [],
        validationExecuted: false,
        realValidationPerformed: false,
        officialXsdLoaded: false,
        officialAnsValidation: false,
        officialTissValidation: false,
        validationRulesLoaded: false,
        validationEngineReady: true,
        runtimeReady: true,
        ...structuralFlags(),
        status: "pending",
        message: "Canonical XML Validation Runtime structural statistics.",
        code: "XML_VALIDATION_RUNTIME_STRUCTURAL_OK",
        createdAt: stamp,
        updatedAt: stamp,
      };
      return {
        ok: true,
        statistics,
        result,
        code: "XML_VALIDATION_RUNTIME_OK",
        message: `XML Validation Runtime stats: ${statistics.totalResults} results.`,
      };
    });
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: XMLValidationRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & XMLValidationRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createXMLValidationRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: XMLValidationRuntimeStructuredLog[] = [];
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
            code: "XML_VALIDATION_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & XMLValidationRuntimeOperationEnvelope;
        }

        if (this.failAttemptsRemaining > 0) {
          this.failAttemptsRemaining -= 1;
          lastError = new Error("Transient structural failure (test).");
          logs.push({
            level: "warn",
            code: "XML_VALIDATION_RUNTIME_RETRY",
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
              reject(new Error("XML Validation Runtime operation timed out."));
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
        code: "XML_VALIDATION_RUNTIME_RETRY_EXHAUSTED",
        message:
          lastError instanceof Error
            ? lastError.message
            : "XML Validation Runtime retries exhausted.",
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & XMLValidationRuntimeOperationEnvelope;
    } catch (error) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        error instanceof Error ? error.message : "XML Validation Runtime operation failed.";
      const isTimeout = /timed out/i.test(message);
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "XML_VALIDATION_RUNTIME_CANCELLED"
          : isTimeout
            ? "XML_VALIDATION_RUNTIME_TIMEOUT"
            : "XML_VALIDATION_RUNTIME_ERROR",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & XMLValidationRuntimeOperationEnvelope;
    }
  }
}

/** Alias oficial enterprise = default adapter (C-02). */
export const EnterpriseXMLValidationRuntimeAdapter = DefaultXMLValidationRuntimeAdapter;

/** Alias TISS-08. */
export const DefaultXMLValidationAdapter = DefaultXMLValidationRuntimeAdapter;
/** Alias TISS-08. */
export const EnterpriseXMLValidationAdapter = EnterpriseXMLValidationRuntimeAdapter;
