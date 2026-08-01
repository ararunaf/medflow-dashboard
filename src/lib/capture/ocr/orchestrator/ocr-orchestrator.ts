/**
 * OcrOrchestrator — seleção de provider, execução, timing e fallback futuro.
 * MEDICFLOW-OCR-IMPLEMENTATION-01 — nesta sprint utiliza somente Azure.
 */
import { DomainError } from "@/lib/domain/operations/errors";
import type { OcrProvider } from "../types/provider";
import type {
  OcrOrchestratorConfig,
  OcrOrchestratorInput,
  OcrOrchestratorResult,
} from "../types/orchestrator";

export class OcrProviderNotFoundError extends DomainError {
  constructor(providerId: string) {
    super("validation_failed", `Provedor OCR não registrado: ${providerId}`, { providerId });
    this.name = "OcrProviderNotFoundError";
  }
}

export class OcrFallbackNotImplementedError extends DomainError {
  constructor(fromProvider: string, toProvider: string) {
    super("not_implemented", `Fallback OCR não implementado: ${fromProvider} → ${toProvider}`, {
      fromProvider,
      toProvider,
    });
    this.name = "OcrFallbackNotImplementedError";
  }
}

export class OcrOrchestrator {
  private readonly config: Required<
    Pick<OcrOrchestratorConfig, "primaryProviderId" | "timeoutMs">
  > &
    Pick<OcrOrchestratorConfig, "fallbackProviderIds">;

  constructor(
    private readonly providers: Map<string, OcrProvider>,
    config?: Partial<OcrOrchestratorConfig>,
  ) {
    this.config = {
      primaryProviderId: config?.primaryProviderId ?? "azure_document_intelligence",
      fallbackProviderIds: config?.fallbackProviderIds ?? [],
      timeoutMs: config?.timeoutMs ?? 30_000,
    };
  }

  /** Lista providers registrados (para diagnóstico). */
  listProviderIds(): string[] {
    return [...this.providers.keys()];
  }

  /** Seleciona provider primário configurado. */
  selectProvider(preferredId?: string): OcrProvider {
    const id = preferredId ?? this.config.primaryProviderId;
    const provider = this.providers.get(id);
    if (!provider) throw new OcrProviderNotFoundError(id);
    return provider;
  }

  /**
   * Executa OCR via provider primário.
   * Fallback para GPT/Tesseract lança OcrFallbackNotImplementedError nesta sprint.
   */
  async execute(
    input: OcrOrchestratorInput,
    preferredProviderId?: string,
  ): Promise<OcrOrchestratorResult> {
    const providerId = preferredProviderId ?? this.config.primaryProviderId;
    const provider = this.selectProvider(providerId);
    const started = Date.now();

    try {
      const result = await this.withTimeout(
        provider.extract({
          sessionId: input.sessionId,
          tenantId: input.tenantId,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          fileBytes: input.fileBytes,
        }),
        this.config.timeoutMs,
      );

      return {
        result: {
          ...result,
          processingTimeMs: Date.now() - started,
        },
        providerId: provider.providerId,
        processingTimeMs: Date.now() - started,
        usedFallback: false,
      };
    } catch (primaryError) {
      const fallbackId = this.config.fallbackProviderIds?.[0];
      if (!fallbackId) throw primaryError;

      const fallback = this.providers.get(fallbackId);
      if (!fallback) throw new OcrProviderNotFoundError(fallbackId);

      const health = await fallback.health();
      if (!health.available) {
        throw new OcrFallbackNotImplementedError(providerId, fallbackId);
      }

      throw new OcrFallbackNotImplementedError(providerId, fallbackId);
    }
  }

  /** Health check do provider primário. */
  async healthCheck(providerId?: string) {
    const provider = this.selectProvider(providerId);
    return provider.health();
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new DomainError("internal_error", `OCR timeout após ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}

import { createDefaultOcrProviders } from "../providers";

export function createDefaultOcrOrchestrator(
  providers?: Map<string, OcrProvider>,
  config?: Partial<OcrOrchestratorConfig>,
): OcrOrchestrator {
  return new OcrOrchestrator(providers ?? createDefaultOcrProviders(), config);
}
