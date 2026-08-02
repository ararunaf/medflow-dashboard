/**
 * Bridge produto → Enterprise Foundation para OCR (OCR-01).
 *
 * NÃO chama Azure/HTTP diretamente.
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Runtime
 *     → OCR Runtime → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 */
import { DomainError } from "@/lib/domain/operations/errors";
import { getEnterpriseRuntime } from "@/lib/enterprise/runtime";
import type { CanonicalOCRResult } from "@/lib/enterprise/ocr-runtime";
import type { OCRProcessInput } from "@/lib/enterprise/ocr-provider";
import { AzureDocumentIntelligenceAdapter, type AzureFetchFn } from "@/lib/enterprise/ocr-provider";
import { createCanonicalExecutionOrchestratorPort } from "@/lib/enterprise/canonical-execution-orchestrator";
import { createOCRRuntimePort } from "@/lib/enterprise/ocr-runtime";
import type { JsonObject } from "@/lib/database.types";
import type { RawOcrResult } from "../types/raw-ocr-result";

export type ProcessCaptureOcrViaEnterpriseInput = {
  sessionId: string;
  tenantId: string;
  storagePath: string;
  mimeType: string;
  fileBytes: Uint8Array;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  /**
   * Somente testes: injeta fetch no Adapter Azure atrás do OCR Runtime.
   * Produção NÃO usa este parâmetro — Runtime oficial resolve o Adapter.
   */
  fetchFn?: AzureFetchFn;
  pollIntervalMs?: number;
  maxPolls?: number;
};

function isRawOcrResult(value: unknown): value is RawOcrResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.fullText === "string" &&
    Array.isArray(candidate.pages) &&
    typeof candidate.provider === "string"
  );
}

export function mapCanonicalOcrResultToRaw(result: CanonicalOCRResult): RawOcrResult {
  const structured = result.output?.structuredData;
  const raw = structured?.rawOcrResult;
  if (isRawOcrResult(raw)) {
    return {
      ...raw,
      metadata: (raw.metadata ?? {}) as JsonObject,
    };
  }

  const fullText = typeof structured?.extractedText === "string" ? structured.extractedText : "";
  return {
    fullText,
    pages: [],
    averageConfidence: result.output?.confidence ?? 0,
    provider: "azure_document_intelligence",
    providerVersion: "enterprise-ocr-runtime",
    processingTimeMs: result.processing?.duration ?? 0,
    wordCount: typeof structured?.wordCount === "number" ? structured.wordCount : 0,
    pageCount: typeof structured?.pageCount === "number" ? structured.pageCount : 0,
    metadata: {
      viaEnterprise: true,
      runtimeSessionId: result.runtimeSessionId ?? null,
      code: result.code ?? null,
    } as JsonObject,
  };
}

async function processViaInjectedAdapter(
  input: ProcessCaptureOcrViaEnterpriseInput,
): Promise<CanonicalOCRResult> {
  const adapter = new AzureDocumentIntelligenceAdapter({
    fetchFn: input.fetchFn,
    pollIntervalMs: input.pollIntervalMs,
    maxPolls: input.maxPolls,
  });
  const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
  const ocrRuntime = createOCRRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestrator,
      getOCRProviderPort: () => adapter,
    },
  });

  return ocrRuntime.process(toProcessInput(input));
}

function toProcessInput(input: ProcessCaptureOcrViaEnterpriseInput): OCRProcessInput & {
  documentId: string;
  sessionId: string;
  tenantRef: string;
} {
  return {
    requestId: `capture-ocr-${input.sessionId}`,
    contentType: input.mimeType,
    language: "pt-BR",
    fileBytes: input.fileBytes,
    signal: input.signal,
    timeoutMs: input.timeoutMs,
    retryCount: input.retryCount,
    documentId: input.sessionId,
    sessionId: input.sessionId,
    tenantRef: input.tenantId,
    documentIdentityReference: {
      documentId: input.sessionId,
      kind: "document",
    },
    attributes: {
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
    },
  };
}

/**
 * Executa OCR exclusivamente pela Enterprise Foundation.
 */
export async function processCaptureOcrViaEnterprise(
  input: ProcessCaptureOcrViaEnterpriseInput,
): Promise<{ canonical: CanonicalOCRResult; raw: RawOcrResult }> {
  const canonical = input.fetchFn
    ? await processViaInjectedAdapter(input)
    : await getEnterpriseRuntime().getCaptureEngineRuntimePort().processOcr(toProcessInput(input));

  if (!canonical.ok) {
    throw new DomainError(
      "internal_error",
      canonical.message ?? "Falha ao executar OCR via Enterprise Runtime.",
      { code: canonical.code ?? "OCR_ENTERPRISE_FAILED" },
    );
  }

  return { canonical, raw: mapCanonicalOcrResultToRaw(canonical) };
}

/**
 * Health do provider Azure exclusivamente via OCRProviderPort.
 */
export async function healthCaptureOcrViaEnterprise(): Promise<{
  available: boolean;
  latencyMs?: number;
  message?: string;
}> {
  const health = await getEnterpriseRuntime().getOCRProviderPort().health();
  return {
    available: health.ok,
    latencyMs: health.latencyMs,
    message: health.message,
  };
}
