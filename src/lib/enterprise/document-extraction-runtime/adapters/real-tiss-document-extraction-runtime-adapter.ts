/**
 * RealTissDocumentExtractionRuntimeAdapter — A2-02.
 *
 * Implementação real do DocumentExtractionRuntimePort que invoca o TissParser
 * sobre um RawOcrResult, produzindo campos canônicos e guia estruturada.
 *
 * Não cria Port / Runtime / Gateway / Pipeline paralelo.
 * Não faz bypass — é um adapter autorizado do DocumentExtractionRuntimePort.
 */
import { getDefaultTissParser, TissParser } from "@/lib/capture/parser/engine/tiss-parser";
import type { RawOcrResult } from "@/lib/capture/ocr/types/raw-ocr-result";
import type { StructuredField, StructuredGuide } from "@/lib/capture/parser/types/structured-guide";
import { DefaultDocumentExtractionRuntimeAdapter } from "./default-document-extraction-runtime-adapter";
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import {
  DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalExtractionCapabilities,
} from "../ports/capabilities";
import {
  DOCUMENT_EXTRACTION_RUNTIME_IDENTITY,
  createDocumentExtractionResultId,
} from "../ports/identity";
import type {
  CloseExtractionJobInput,
  CloseExtractionJobResult,
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeEnterpriseDeps,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
  DocumentExtractionRuntimeOperationalControls,
  ExtractionStatsInput,
  ExtractionStatsResult,
  GetExtractionResultInput,
  GetExtractionResultResult,
  OpenExtractionJobInput,
  OpenExtractionJobResult,
  RegisterExtractionDocumentInput,
  RegisterExtractionDocumentResult,
  SubmitExtractionRequestInput,
  SubmitExtractionRequestResult,
} from "../ports/types";
import type {
  DocumentExtractionResult,
  ExtractionField,
  ExtractionSummary,
} from "../ports/canonical";
import type { DocumentExtractionRuntimeStore } from "../store";
import { InMemoryDocumentExtractionRuntimeStore } from "../store";

export const REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID =
  "real-tiss-document-extraction-runtime";
export const REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type RealTissDocumentExtractionRuntimeAdapterOptions = {
  rawOcrResult?: RawOcrResult;
  tissParser?: TissParser;
  store?: DocumentExtractionRuntimeStore;
  enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;
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

function structuralFlags() {
  return {
    fieldExtractionImplemented: false,
    structuredExtractionImplemented: false,
    medicalGuideExtractionImplemented: false,
    tableExtractionImplemented: false,
    templateExtractionImplemented: false,
    automaticMappingImplemented: false,
    confidenceScoreImplemented: false,
    barcodeExtractionImplemented: false,
    qrExtractionImplemented: false,
    pipelineSelectionImplemented: false,
  } as const;
}

function mapFieldStatus(status: StructuredField["status"]): DocumentExtractionResult["status"] {
  switch (status) {
    case "found":
    case "partial":
    case "duplicate":
    case "out_of_position":
      return "processed";
    case "missing":
      return "failed";
    default:
      return "unknown";
  }
}

function buildConfidenceBand(score: number): "low" | "medium" | "high" | "unknown" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

/**
 * Adapter real F3-CAP-07 — TISS parser integrado ao DocumentExtractionRuntimePort.
 */
export class RealTissDocumentExtractionRuntimeAdapter implements DocumentExtractionRuntimePort {
  readonly providerId = "real-tiss" as const;

  private readonly metadata = {
    name: "Real TISS Document Extraction Runtime",
    version: REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.layer,
    vendorAgnostic: DOCUMENT_EXTRACTION_RUNTIME_IDENTITY.vendorAgnostic,
    description:
      "Real TISS Document Extraction Runtime — invoca TissParser sobre OCR e produz StructuredGuide canônica.",
  };

  private readonly delegate: DefaultDocumentExtractionRuntimeAdapter;
  private readonly tissParser: TissParser;
  private readonly rawOcrResultMap = new Map<string, RawOcrResult>();

  constructor(options: RealTissDocumentExtractionRuntimeAdapterOptions = {}) {
    this.tissParser = options.tissParser ?? getDefaultTissParser();
    this.delegate = new DefaultDocumentExtractionRuntimeAdapter({
      provider: "enterprise",
      store: options.store ?? new InMemoryDocumentExtractionRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS,
      defaultRetryCount: options.defaultRetryCount ?? DEFAULT_RETRY_COUNT,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    });
    if (options.rawOcrResult) {
      this.rawOcrResultMap.set("__default__", options.rawOcrResult);
    }
  }

  capabilities(): DocumentExtractionRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: REAL_TISS_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalExtraction: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      engine: { ...DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalExtractionCapabilities(
        DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): DocumentExtractionRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: "ready",
      providerType: "DOCUMENT_EXTRACTION_RUNTIME",
      capabilities: { ...DEFAULT_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentExtractionRuntimeHealth> {
    const base = await this.delegate.health();
    return {
      ...base,
      provider: this.providerId,
      message: "Real TISS Document Extraction Runtime ready (TissParser ativo).",
      runtimeReady: true,
      fieldExtractionImplemented: false,
      structuredExtractionImplemented: false,
      medicalGuideExtractionImplemented: false,
      tableExtractionImplemented: false,
      templateExtractionImplemented: false,
      automaticMappingImplemented: false,
      confidenceScoreImplemented: false,
      barcodeExtractionImplemented: false,
      qrExtractionImplemented: false,
      pipelineSelectionImplemented: false,
    };
  }

  async openJob(input: OpenExtractionJobInput): Promise<OpenExtractionJobResult> {
    const res = await this.delegate.openJob(input);
    return { ...res, provider: this.providerId };
  }

  async closeJob(input: CloseExtractionJobInput): Promise<CloseExtractionJobResult> {
    const res = await this.delegate.closeJob(input);
    return { ...res, provider: this.providerId };
  }

  async registerDocument(
    input: RegisterExtractionDocumentInput,
  ): Promise<RegisterExtractionDocumentResult> {
    const res = await this.delegate.registerDocument(input);
    return { ...res, provider: this.providerId };
  }

  async stats(input?: ExtractionStatsInput): Promise<ExtractionStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }

  async submitRequest(input: SubmitExtractionRequestInput): Promise<SubmitExtractionRequestResult> {
    const res = await this.delegate.submitRequest(input);
    if (res.ok && res.request?.requestId) {
      const defaultRaw = this.rawOcrResultMap.get("__default__");
      const customRaw =
        typeof input.metadata?.customAttributes?.rawOcrResult === "string"
          ? (JSON.parse(input.metadata.customAttributes.rawOcrResult) as RawOcrResult)
          : undefined;
      const raw = customRaw ?? defaultRaw;
      if (raw) {
        this.rawOcrResultMap.set(res.request.requestId, raw);
      }
    }
    return { ...res, provider: this.providerId };
  }

  async getResult(input: GetExtractionResultInput): Promise<GetExtractionResultResult> {
    const res = await this.delegate.getResult(input);
    if (!res.ok || !res.result) {
      return { ...res, provider: this.providerId };
    }

    const requestId = input.requestId ?? res.request?.requestId;
    const documentId =
      res.request?.documentId ?? input.documentId ?? res.document?.documentId ?? "unknown";
    const raw =
      (requestId ? this.rawOcrResultMap.get(requestId) : undefined) ??
      this.rawOcrResultMap.get("__default__");

    if (!raw) {
      return {
        provider: this.providerId,
        telemetry: res.telemetry,
        ok: false,
        code: "REAL_TISS_PARSER_NO_OCR",
        message: "Real TISS parser requer RawOcrResult (não encontrado para request).",
      };
    }

    try {
      const guide = this.tissParser.parse(raw, { sessionId: documentId });
      const fields = this.buildFields(guide);
      const summary = this.buildSummary(guide, fields);
      const classificationContext =
        res.request?.classificationContext ?? res.result.classificationContext;
      const result: DocumentExtractionResult = {
        ...res.result,
        resultId: createDocumentExtractionResultId(),
        operation: "getResult",
        status: "processed",
        fields,
        tables: [],
        summary,
        metadata: res.request?.metadata,
        classificationContext,
        extractionContext: {
          kind: "canonical-extraction-context",
          requestId: requestId ?? res.request?.requestId,
          documentId,
          classificationContext,
          confidence: summary
            ? {
                kind: "canonical-extraction-confidence",
                score: guide.metadata.overallConfidence,
                band: buildConfidenceBand(guide.metadata.overallConfidence),
              }
            : undefined,
          structuralNotes: `Real TISS parser: ${guide.metadata.fieldsFound} encontrados, ${guide.metadata.fieldsMissing} ausentes.`,
        },
        confidence: {
          kind: "canonical-extraction-confidence",
          score: guide.metadata.overallConfidence,
          band: buildConfidenceBand(guide.metadata.overallConfidence),
        },
        runtimeReady: true,
        code: "REAL_TISS_PARSER_OK",
        messageText: `Real TISS parser concluído: ${guide.guideType} (${guide.metadata.fieldsFound} campos encontrados).`,
        ...structuralFlags(),
      };

      return {
        provider: this.providerId,
        telemetry: res.telemetry,
        requestId: input.requestId,
        ok: true,
        result,
        job: res.job,
        request: res.request,
        document: res.document,
        code: "REAL_TISS_PARSER_OK",
        message: result.messageText,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        provider: this.providerId,
        telemetry: res.telemetry,
        requestId: input.requestId,
        ok: false,
        code: "REAL_TISS_PARSER_FAILED",
        message: `TissParser falhou: ${message}`,
      };
    }
  }

  private buildFields(guide: StructuredGuide): ExtractionField[] {
    return Object.values(guide.fields).map((sf: StructuredField) => ({
      kind: "canonical-extraction-field",
      fieldId: sf.code,
      fieldName: sf.label,
      fieldPath: `${sf.group}/${sf.code}`,
      status: mapFieldStatus(sf.status),
      value: sf.value,
      confidence: {
        kind: "canonical-extraction-confidence",
        score: sf.confidence,
        band: buildConfidenceBand(sf.confidence),
      },
      fieldExtractionImplemented: false,
      structuredExtractionImplemented: false,
      automaticMappingImplemented: false,
      confidenceScoreImplemented: false,
    }));
  }

  private buildSummary(guide: StructuredGuide, fields: ExtractionField[]): ExtractionSummary {
    return {
      kind: "canonical-extraction-summary",
      fieldCount: fields.length,
      tableCount: 0,
      status: "processed",
      classificationContext: guide.metadata.overallConfidence
        ? {
            kind: "canonical-document-classification-context",
            guideType: guide.guideType,
            confidence: {
              kind: "canonical-extraction-confidence",
              score: guide.metadata.overallConfidence,
              band: buildConfidenceBand(guide.metadata.overallConfidence),
            },
          }
        : undefined,
      ...structuralFlags(),
    };
  }
}
