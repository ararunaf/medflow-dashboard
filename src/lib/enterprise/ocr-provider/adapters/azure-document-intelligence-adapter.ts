/**
 * AzureDocumentIntelligenceAdapter — OCR-01 / EPC-15.
 *
 * Único ponto autorizado de chamada HTTP ao Azure Document Intelligence.
 * Application / produto / OCR Runtime NÃO devem chamar Azure diretamente.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure
 *
 * Produz exclusivamente ProcessingOutput + DocumentProcessingResult (EPC-13).
 * Sem classificação, IA, embeddings, RAG, XML ou TISS.
 */
import { createOutputId, createProcessingId } from "../../document-processor/ports/identity";
import type {
  DocumentProcessingResult,
  ProcessingOutput,
  ProcessingOutputPage,
} from "../../document-processor/ports/types";
import { FUTURE_NORMALIZATION_TAG } from "../ports/extension-points";
import { createOCRRequestId } from "../ports/identity";
import type { OCRProviderPort } from "../ports/ocr-provider-port";
import type { OCRCapabilities } from "../ports/capabilities";
import type {
  OCRConfigurationValidation,
  OCRProcessInput,
  OCRProcessResult,
  OCRProviderHealth,
  OCRProviderInfo,
  OCRProviderPortCapabilities,
} from "../ports/types";

export const AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID = "azure-document-intelligence";
export const AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION = "prebuilt-layout@2024-11-30";
export const AZURE_DOCUMENT_INTELLIGENCE_API_VERSION = "2024-11-30";

const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_MAX_POLLS = 60;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 250;

const SUPPORTED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const;

export const DEFAULT_AZURE_OCR_CAPABILITIES: OCRCapabilities = {
  supportedFormats: [...SUPPORTED_MIMES],
  supportedLanguages: ["pt-BR", "en"],
  supportsMultiPage: true,
  supportsTables: true,
  supportsHandwriting: true,
  supportsConfidence: true,
  supportsRotation: true,
  supportsBatch: false,
  supportsAsync: true,
  maxPages: 100,
  maxFileSize: 25 * 1024 * 1024,
};

export type AzureFetchFn = typeof fetch;

export type AzureDocumentIntelligenceAdapterOptions = {
  fetchFn?: AzureFetchFn;
  pollIntervalMs?: number;
  maxPolls?: number;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  createProcessingId?: () => string;
  createOutputId?: () => string;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
};

type AzureAnalyzeResponse = {
  status?: string;
  analyzeResult?: {
    content?: string;
    pages?: Array<{
      pageNumber?: number;
      width?: number;
      height?: number;
      unit?: string;
      words?: Array<{ content?: string; confidence?: number; polygon?: number[] }>;
      lines?: Array<{ content?: string; polygon?: number[] }>;
    }>;
  };
  error?: { message?: string; code?: string };
};

type AzureConfig = { endpoint: string; apiKey: string };

type CanonicalOcrPage = {
  pageNumber: number;
  width: number;
  height: number;
  unit: string;
  rawText: string;
  lines: Array<{
    text: string;
    confidence: number;
    coordinates: {
      polygon?: number[];
      boundingBox: { x: number; y: number; width: number; height: number };
    };
    words: Array<{
      text: string;
      confidence: number;
      coordinates: {
        polygon?: number[];
        boundingBox: { x: number; y: number; width: number; height: number };
      };
    }>;
  }>;
  words: Array<{
    text: string;
    confidence: number;
    coordinates: {
      polygon?: number[];
      boundingBox: { x: number; y: number; width: number; height: number };
    };
  }>;
};

export function resolveAzureDocumentIntelligenceConfig(): AzureConfig | null {
  const endpoint =
    (typeof process !== "undefined" && process.env?.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT) ||
    (typeof process !== "undefined" && process.env?.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT);
  const apiKey =
    (typeof process !== "undefined" && process.env?.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY) ||
    (typeof process !== "undefined" && process.env?.AZURE_DOCUMENT_INTELLIGENCE_KEY);

  if (
    typeof endpoint === "string" &&
    endpoint.length > 0 &&
    typeof apiKey === "string" &&
    apiKey.length > 0
  ) {
    return { endpoint: endpoint.replace(/\/$/, ""), apiKey };
  }
  return null;
}

function polygonToBoundingBox(polygon: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!polygon.length) return { x: 0, y: 0, width: 0, height: 0 };
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < polygon.length; i += 2) {
    xs.push(polygon[i] ?? 0);
    ys.push(polygon[i + 1] ?? 0);
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function buildCoordinates(polygon?: number[]) {
  const box = polygon?.length ? polygonToBoundingBox(polygon) : { x: 0, y: 0, width: 0, height: 0 };
  return { polygon, boundingBox: box };
}

function averageConfidence(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readFileBytes(input: OCRProcessInput): Uint8Array | null {
  if (input.fileBytes instanceof Uint8Array) return input.fileBytes;
  const attr = input.attributes?.fileBytes;
  if (attr instanceof Uint8Array) return attr;
  if (ArrayBuffer.isView(attr)) {
    const view = attr as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  return null;
}

function readSignal(input: OCRProcessInput): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/**
 * Adapter oficial Azure Document Intelligence (prebuilt-layout).
 * Também exportado como `AzureDocumentIntelligenceAdapter`.
 */
export class AzureDocumentIntelligenceAdapter implements OCRProviderPort {
  readonly providerId = "azure" as const;

  private readonly fetchFn: AzureFetchFn;
  private readonly pollIntervalMs: number;
  private readonly maxPolls: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly createProcessingIdFn: () => string;
  private readonly createOutputIdFn: () => string;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: AzureDocumentIntelligenceAdapterOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.maxPolls = options.maxPolls ?? DEFAULT_MAX_POLLS;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.createProcessingIdFn = options.createProcessingId ?? createProcessingId;
    this.createOutputIdFn = options.createOutputId ?? createOutputId;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
  }

  capabilities(): OCRProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
      ocr: { ...DEFAULT_AZURE_OCR_CAPABILITIES },
      supportsCanonicalProcessingOutput: true,
      supportsDocumentProcessingResult: true,
      supportsDocumentIdentityReference: true,
      supportsMetadataReference: true,
      supportsFutureNormalizationHook: true,
      supportsFutureRealEngines: true,
    };
  }

  providerInfo(): OCRProviderInfo {
    return {
      providerId: this.providerId,
      metadata: {
        name: "Azure Document Intelligence",
        version: AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION,
        vendor: "microsoft-azure",
        description:
          "Official Azure Document Intelligence adapter — sole authorized HTTP path (OCR-01).",
      },
      status: "ready",
      providerType: "OCR",
      capabilities: { ...DEFAULT_AZURE_OCR_CAPABILITIES },
    };
  }

  async health(): Promise<OCRProviderHealth> {
    const config = resolveAzureDocumentIntelligenceConfig();
    return {
      ok: true,
      provider: this.providerId,
      latencyMs: 0,
      status: "ready",
      message: config
        ? "Azure Document Intelligence adapter ready (credentials present)."
        : "Azure adapter ready (credentials absent — process will fail until MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_* is configured).",
    };
  }

  async validateConfiguration(): Promise<OCRConfigurationValidation> {
    const config = resolveAzureDocumentIntelligenceConfig();
    if (!config) {
      return {
        ok: false,
        provider: this.providerId,
        errors: [
          "Azure Document Intelligence não configurado: defina MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT e MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY.",
        ],
        warnings: [],
        message: "Credenciais Azure ausentes.",
      };
    }
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: "Configuração Azure Document Intelligence válida (endpoint + key presentes).",
    };
  }

  async process(input: OCRProcessInput): Promise<OCRProcessResult> {
    const requestId = input.requestId ?? createOCRRequestId();
    const startedAt = this.now();
    const startedMs = Date.now();
    const processingId = this.createProcessingIdFn();
    const outputId = this.createOutputIdFn();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(
      input.timeoutMs ?? input.attributes?.timeoutMs,
      this.defaultTimeoutMs,
    );
    const retryCount = readPositiveInt(
      input.retryCount ?? input.attributes?.retryCount,
      this.defaultRetryCount,
    );
    const retryBackoffMs = readPositiveInt(
      input.attributes?.retryBackoffMs,
      this.defaultRetryBackoffMs,
    );

    const fail = (message: string, code: string, attempts: number): OCRProcessResult => {
      const finishedAt = this.now();
      const processing: DocumentProcessingResult = {
        processingId,
        processorType: "OCR",
        status: "FAILED",
        startedAt,
        finishedAt,
        duration: Math.max(0, Date.now() - startedMs),
        documentIdentityReference: input.documentIdentityReference,
        metadataReference: input.metadataReference,
        errors: [{ code, message }],
        tags: ["ocr", "azure", FUTURE_NORMALIZATION_TAG],
        customAttributes: {
          providerId: this.providerId,
          adapterId: AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
          simulated: false,
          realOcr: true,
          http: true,
          attempts,
          timeoutMs,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts,
            cancelled: signal?.aborted === true,
          },
        },
      };
      const output: ProcessingOutput = {
        outputId,
        contentType: input.contentType ?? "application/octet-stream",
        structuredData: {},
        confidence: 0,
        language: input.language,
        metadataReference: input.metadataReference,
        rawDataReference: input.rawDataReference,
      };
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        processing,
        output,
        simulated: false,
        message,
      };
    };

    if (signal?.aborted) {
      return fail("OCR cancelado antes do início.", "OCR_CANCELLED", 0);
    }

    const config = resolveAzureDocumentIntelligenceConfig();
    if (!config) {
      return fail(
        "Azure Document Intelligence não configurado: defina MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT e MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY.",
        "OCR_CONFIG_MISSING",
        0,
      );
    }

    const fileBytes = readFileBytes(input);
    if (!fileBytes) {
      return fail(
        "OCRProcessInput.fileBytes é obrigatório para o Azure Document Intelligence Adapter.",
        "OCR_INPUT_MISSING_BYTES",
        0,
      );
    }

    if (fileBytes.length === 0) {
      const finishedAt = this.now();
      const output = this.buildCanonicalOutput({
        outputId,
        input,
        fullText: "",
        pages: [],
        averageConfidence: 0,
        processingTimeMs: Math.max(0, Date.now() - startedMs),
        emptyDocument: true,
      });
      const processing: DocumentProcessingResult = {
        processingId,
        processorType: "OCR",
        status: "COMPLETED",
        startedAt,
        finishedAt,
        duration: Math.max(0, Date.now() - startedMs),
        confidence: 0,
        documentIdentityReference: input.documentIdentityReference,
        metadataReference: input.metadataReference,
        outputReference: {
          outputId: output.outputId,
          contentType: output.contentType,
          kind: "processing-output",
        },
        capabilities: ["extraction", "canonical-output"],
        tags: ["ocr", "azure", "extraction", FUTURE_NORMALIZATION_TAG],
        customAttributes: {
          providerId: this.providerId,
          adapterId: AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
          simulated: false,
          realOcr: true,
          http: false,
          emptyDocument: true,
          telemetry: { latencyMs: 0, attempts: 0, cancelled: false },
        },
      };
      return {
        ok: true,
        requestId,
        provider: this.providerId,
        processing,
        output,
        simulated: false,
        message: "Empty document — Azure OCR skipped.",
      };
    }

    let lastError: string | undefined;
    const maxAttempts = retryCount + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("OCR cancelado.", "OCR_CANCELLED", attempt);
      }

      try {
        const azureResult = await this.withTimeout(
          this.analyzeWithAzure(config, input, fileBytes, signal),
          timeoutMs,
          signal,
        );
        const pages = this.mapPages(azureResult);
        const fullText =
          azureResult.analyzeResult?.content ?? pages.map((page) => page.rawText).join("\n\n");
        const confidences = pages.flatMap((page) => page.words.map((word) => word.confidence));
        const average = averageConfidence(confidences);
        const processingTimeMs = Math.max(0, Date.now() - startedMs);
        const finishedAt = this.now();

        const output = this.buildCanonicalOutput({
          outputId,
          input,
          fullText,
          pages,
          averageConfidence: average,
          processingTimeMs,
          emptyDocument: false,
        });

        const processing: DocumentProcessingResult = {
          processingId,
          processorType: "OCR",
          status: "COMPLETED",
          startedAt,
          finishedAt,
          duration: processingTimeMs,
          confidence: average,
          documentIdentityReference: input.documentIdentityReference,
          metadataReference: input.metadataReference,
          outputReference: {
            outputId: output.outputId,
            contentType: output.contentType,
            kind: "processing-output",
          },
          capabilities: ["extraction", "canonical-output", "azure-document-intelligence"],
          tags: ["ocr", "azure", "extraction", FUTURE_NORMALIZATION_TAG],
          customAttributes: {
            providerId: this.providerId,
            adapterId: AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
            simulated: false,
            realOcr: true,
            http: true,
            azureModel: "prebuilt-layout",
            attempts: attempt,
            telemetry: {
              latencyMs: processingTimeMs,
              attempts: attempt,
              cancelled: false,
              pageCount: pages.length,
              wordCount: pages.reduce((sum, page) => sum + page.words.length, 0),
            },
            normalizationHook: "EP-NORM-01",
          },
        };

        return {
          ok: true,
          requestId,
          provider: this.providerId,
          processing,
          output,
          simulated: false,
          message: "Azure Document Intelligence OCR completed (ProcessingOutput canonical).",
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "OCR_CANCELLED", attempt);
        }
        if (attempt < maxAttempts) {
          await this.sleep(retryBackoffMs * attempt);
          continue;
        }
      }
    }

    return fail(lastError ?? "Falha desconhecida no Azure OCR.", "OCR_AZURE_FAILED", maxAttempts);
  }

  private buildCanonicalOutput(params: {
    outputId: string;
    input: OCRProcessInput;
    fullText: string;
    pages: CanonicalOcrPage[];
    averageConfidence: number;
    processingTimeMs: number;
    emptyDocument: boolean;
  }): ProcessingOutput {
    const wordCount = params.pages.reduce((sum, page) => sum + page.words.length, 0);
    const outputPages: ProcessingOutputPage[] = params.pages.map((page) => ({
      pageId: `page-${page.pageNumber}`,
      sequence: page.pageNumber,
      confidence: averageConfidence(page.words.map((word) => word.confidence)),
      tags: ["ocr", "azure"],
      customAttributes: {
        width: page.width,
        height: page.height,
        unit: page.unit,
        rawText: page.rawText,
        lines: page.lines,
        words: page.words,
      },
    }));

    return {
      outputId: params.outputId,
      contentType: params.input.contentType ?? "application/octet-stream",
      structuredData: {
        extractedText: params.fullText,
        pageCount: params.pages.length,
        wordCount,
        averageConfidence: params.averageConfidence,
        engine: AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
        provider: "azure_document_intelligence",
        providerVersion: AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION,
        processingTimeMs: params.processingTimeMs,
        emptyDocument: params.emptyDocument,
        /**
         * Payload isomórfico ao RawOcrResult do produto — sem criar modelo paralelo.
         * Persistência / UI continuam usando o modelo de produto via bridge.
         */
        rawOcrResult: {
          fullText: params.fullText,
          pages: params.pages,
          averageConfidence: params.averageConfidence,
          provider: "azure_document_intelligence",
          providerVersion: AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION,
          processingTimeMs: params.processingTimeMs,
          wordCount,
          pageCount: params.pages.length,
          metadata: {
            emptyDocument: params.emptyDocument,
            azureModel: "prebuilt-layout",
            sessionId: params.input.attributes?.sessionId ?? null,
            storagePath: params.input.attributes?.storagePath ?? null,
            mimeType: params.input.contentType ?? null,
          },
        },
      },
      rawDataReference: params.input.rawDataReference,
      metadataReference: params.input.metadataReference,
      confidence: params.averageConfidence,
      language: params.input.language ?? "pt-BR",
      encoding: "utf-8",
      pages: outputPages,
    };
  }

  private async analyzeWithAzure(
    config: AzureConfig,
    input: OCRProcessInput,
    fileBytes: Uint8Array,
    signal: AbortSignal | undefined,
  ): Promise<AzureAnalyzeResponse> {
    const analyzeUrl = `${config.endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_DOCUMENT_INTELLIGENCE_API_VERSION}`;
    const analyzeRes = await this.fetchFn(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey,
        "Content-Type": input.contentType ?? "application/octet-stream",
      },
      body: fileBytes as unknown as BodyInit,
      signal,
    });

    if (!analyzeRes.ok && analyzeRes.status !== 202) {
      const errBody = (await analyzeRes.json().catch(() => ({}))) as AzureAnalyzeResponse;
      const msg = errBody.error?.message ?? `Azure analyze HTTP ${analyzeRes.status}`;
      throw new Error(`Falha ao iniciar OCR Azure: ${msg}`);
    }

    const operationLocation =
      analyzeRes.headers.get("operation-location") ?? analyzeRes.headers.get("Operation-Location");
    if (!operationLocation) {
      throw new Error("Azure não retornou Operation-Location.");
    }

    return this.pollResult(config.apiKey, operationLocation, signal);
  }

  private async pollResult(
    apiKey: string,
    operationLocation: string,
    signal: AbortSignal | undefined,
  ): Promise<AzureAnalyzeResponse> {
    for (let i = 0; i < this.maxPolls; i++) {
      if (signal?.aborted) {
        throw new Error("OCR cancelado durante polling Azure.");
      }

      const res = await this.fetchFn(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
        signal,
      });
      const body = (await res.json()) as AzureAnalyzeResponse;

      if (!res.ok) {
        const msg = body.error?.message ?? `Azure poll HTTP ${res.status}`;
        throw new Error(msg);
      }

      if (body.status === "succeeded") return body;
      if (body.status === "failed") {
        throw new Error(body.error?.message ?? "Azure OCR falhou.");
      }

      await this.sleep(this.pollIntervalMs);
    }

    throw new Error("Timeout aguardando resultado Azure OCR.");
  }

  private mapPages(response: AzureAnalyzeResponse): CanonicalOcrPage[] {
    const rawPages = response.analyzeResult?.pages ?? [];
    return rawPages.map((page, idx) => {
      const words = (page.words ?? []).map((word) => ({
        text: word.content ?? "",
        confidence: word.confidence ?? 0,
        coordinates: buildCoordinates(word.polygon),
      }));
      const lines = (page.lines ?? []).map((line) => {
        const lineWords = words.filter((word) => line.content?.includes(word.text));
        const selected = lineWords.length ? lineWords : words.slice(0, 1);
        return {
          text: line.content ?? "",
          confidence: averageConfidence(selected.map((word) => word.confidence)),
          coordinates: buildCoordinates(line.polygon),
          words: selected,
        };
      });

      return {
        pageNumber: page.pageNumber ?? idx + 1,
        width: page.width ?? 0,
        height: page.height ?? 0,
        unit: page.unit ?? "pixel",
        lines,
        words,
        rawText: lines.map((line) => line.text).join("\n"),
      };
    });
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (timeoutMs <= 0) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`OCR timeout após ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const onAbort = () => {
      if (timer) clearTimeout(timer);
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
