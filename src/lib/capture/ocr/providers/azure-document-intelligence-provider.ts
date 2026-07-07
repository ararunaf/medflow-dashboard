/**
 * Azure Document Intelligence — Tier 1 OCR (prebuilt-layout).
 * MEDICFLOW-OCR-IMPLEMENTATION-01
 */
import { DomainError } from "@/lib/domain/operations/errors";
import type { OcrPage } from "../types/raw-ocr-result";
import type { OcrProvider, OcrProviderExtractInput, OcrProviderHealth } from "../types/provider";
import {
  buildRawOcrResult,
  CAPTURE_OCR_MAX_BYTES,
  CAPTURE_OCR_SUPPORTED_MIMES,
  mapAzureLine,
  mapAzureWord,
  resolveAzureConfig,
} from "./shared";

const PROVIDER_ID = "azure_document_intelligence";
const PROVIDER_VERSION = "prebuilt-layout@2024-11-30";
const API_VERSION = "2024-11-30";
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_MAX_POLLS = 60;

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

export type AzureFetchFn = typeof fetch;

export class AzureDocumentIntelligenceProvider implements OcrProvider {
  readonly providerId = PROVIDER_ID;
  readonly providerVersion = PROVIDER_VERSION;

  constructor(
    private readonly fetchFn: AzureFetchFn = fetch,
    private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    private readonly maxPolls = DEFAULT_MAX_POLLS,
  ) {}

  capabilities() {
    return {
      providerName: "Azure Document Intelligence",
      supportedMimeTypes: [...CAPTURE_OCR_SUPPORTED_MIMES],
      maxBytes: CAPTURE_OCR_MAX_BYTES,
      supportsMultiPage: true,
      supportsHandwriting: true,
    };
  }

  async health(): Promise<OcrProviderHealth> {
    const config = resolveAzureConfig();
    if (!config) {
      return { available: false, message: "Credenciais Azure não configuradas." };
    }

    const started = Date.now();
    try {
      const url = `${config.endpoint}/documentintelligence/documentModels/prebuilt-layout?api-version=${API_VERSION}`;
      const res = await this.fetchFn(url, {
        method: "GET",
        headers: { "Ocp-Apim-Subscription-Key": config.apiKey },
      });
      const latencyMs = Date.now() - started;
      if (res.ok || res.status === 404) {
        return { available: true, latencyMs, message: "Azure Document Intelligence acessível." };
      }
      return { available: false, latencyMs, message: `Azure HTTP ${res.status}` };
    } catch (err) {
      return {
        available: false,
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async extract(input: OcrProviderExtractInput) {
    const started = Date.now();
    const config = resolveAzureConfig();
    if (!config) {
      throw new DomainError(
        "internal_error",
        "Azure Document Intelligence não configurado: defina MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT e MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY.",
      );
    }

    if (input.fileBytes.length === 0) {
      return buildRawOcrResult({
        fullText: "",
        pages: [],
        provider: this.providerId,
        providerVersion: this.providerVersion,
        processingTimeMs: Date.now() - started,
        metadata: { emptyDocument: true, sessionId: input.sessionId },
      });
    }

    const analyzeUrl = `${config.endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${API_VERSION}`;
    const analyzeRes = await this.fetchFn(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey,
        "Content-Type": input.mimeType,
      },
      body: input.fileBytes,
    });

    if (!analyzeRes.ok && analyzeRes.status !== 202) {
      const errBody = (await analyzeRes.json().catch(() => ({}))) as AzureAnalyzeResponse;
      const msg = errBody.error?.message ?? `Azure analyze HTTP ${analyzeRes.status}`;
      throw new DomainError("internal_error", `Falha ao iniciar OCR Azure: ${msg}`);
    }

    const operationLocation =
      analyzeRes.headers.get("operation-location") ??
      analyzeRes.headers.get("Operation-Location");

    if (!operationLocation) {
      throw new DomainError("internal_error", "Azure não retornou Operation-Location.");
    }

    const result = await this.pollResult(config.apiKey, operationLocation);
    const pages = this.mapPages(result);
    const fullText = result.analyzeResult?.content ?? pages.map((p) => p.rawText).join("\n\n");

    return buildRawOcrResult({
      fullText,
      pages,
      provider: this.providerId,
      providerVersion: this.providerVersion,
      processingTimeMs: Date.now() - started,
      metadata: {
        sessionId: input.sessionId,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        azureModel: "prebuilt-layout",
      },
    });
  }

  private async pollResult(apiKey: string, operationLocation: string): Promise<AzureAnalyzeResponse> {
    for (let i = 0; i < this.maxPolls; i++) {
      const res = await this.fetchFn(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
      });
      const body = (await res.json()) as AzureAnalyzeResponse;

      if (!res.ok) {
        const msg = body.error?.message ?? `Azure poll HTTP ${res.status}`;
        throw new DomainError("internal_error", msg);
      }

      if (body.status === "succeeded") return body;
      if (body.status === "failed") {
        throw new DomainError("internal_error", body.error?.message ?? "Azure OCR falhou.");
      }

      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }

    throw new DomainError("internal_error", "Timeout aguardando resultado Azure OCR.");
  }

  private mapPages(response: AzureAnalyzeResponse): OcrPage[] {
    const rawPages = response.analyzeResult?.pages ?? [];
    return rawPages.map((page, idx) => {
      const words = (page.words ?? []).map(mapAzureWord);
      const lines = (page.lines ?? []).map((line) => {
        const lineWords = words.filter((w) => line.content?.includes(w.text));
        return mapAzureLine(line, lineWords.length ? lineWords : words.slice(0, 1));
      });

      return {
        pageNumber: page.pageNumber ?? idx + 1,
        width: page.width ?? 0,
        height: page.height ?? 0,
        unit: page.unit ?? "pixel",
        lines,
        words,
        rawText: lines.map((l) => l.text).join("\n"),
      };
    });
  }
}
