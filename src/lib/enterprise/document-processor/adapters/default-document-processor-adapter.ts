/**
 * DefaultDocumentProcessorAdapter — adapter default de Document Processing (EPC-13).
 *
 * Encapsula o Default Document Processor Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera UI / APIs.
 * NÃO executa OCR, IA, XML, PDF, Barcode, QRCode ou TISS.
 */
import { createOutputId, createProcessingId } from "../ports/identity";
import type { DocumentProcessorPort } from "../ports/document-processor-port";
import type {
  DocumentProcessingResult,
  DocumentProcessorCapabilities,
  DocumentProcessorHealth,
  GetProcessingInput,
  GetProcessingResult,
  ListProcessingsInput,
  ListProcessingsResult,
  ProcessInput,
  ProcessResult,
  ProcessingOutput,
} from "../ports/types";
import { DefaultDocumentProcessorStore, type DocumentProcessorStore } from "../store";

export const DEFAULT_DOCUMENT_PROCESSOR_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultDocumentProcessorRuntime = {
  /** Store ativo. Default: DefaultDocumentProcessorStore in-process. */
  store?: DocumentProcessorStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de processing id injetável (testes). */
  createId?: () => string;
  /** Gerador de output id injetável (testes). */
  createOutputId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultDocumentProcessorRuntime {
  return {
    store: new DefaultDocumentProcessorStore(),
  };
}

function nowIso(runtime: DefaultDocumentProcessorRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function computeDurationMs(startedAt?: string, finishedAt?: string): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return Math.max(0, end - start);
}

export class DefaultDocumentProcessorAdapter implements DocumentProcessorPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultDocumentProcessorRuntime;
  private readonly store: DocumentProcessorStore;

  constructor(runtime: DefaultDocumentProcessorRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultDocumentProcessorStore();
  }

  capabilities(): DocumentProcessorCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_DOCUMENT_PROCESSOR_ADAPTER_ID,
      supportsProcess: true,
      supportsGetProcessing: true,
      supportsListProcessings: true,
      supportsMultipleProcessorTypes: true,
      supportsCanonicalOutput: true,
      supportsDocumentIdentityReference: true,
      supportsMetadataReference: true,
      supportsStorageReference: true,
      supportsOutputReference: true,
      supportsFutureIntegrationHooks: true,
    };
  }

  async health(): Promise<DocumentProcessorHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default document-processor probe ok."
            : "Default document-processor probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultDocumentProcessorStore pronto (sem I/O externo — EPC-13).",
    };
  }

  async process(input: ProcessInput): Promise<ProcessResult> {
    const stamp = nowIso(this.runtime);
    const processingId =
      input.processing.processingId ?? this.runtime.createId?.() ?? createProcessingId();
    const existing = this.store.getProcessing(processingId);

    let output: ProcessingOutput | undefined;
    if (input.output) {
      const outputId =
        input.output.outputId ??
        existing?.output?.outputId ??
        this.runtime.createOutputId?.() ??
        createOutputId();
      output = {
        ...input.output,
        outputId,
      };
    } else if (existing?.output) {
      output = existing.output;
    }

    const startedAt = input.processing.startedAt ?? existing?.result.startedAt ?? stamp;
    const finishedAt = input.processing.finishedAt ?? existing?.result.finishedAt ?? stamp;
    const duration =
      input.processing.duration ??
      existing?.result.duration ??
      computeDurationMs(startedAt, finishedAt);

    const processing: DocumentProcessingResult = {
      ...input.processing,
      processingId,
      processorType: input.processing.processorType ?? existing?.result.processorType ?? "UNKNOWN",
      status: input.processing.status ?? existing?.result.status ?? "COMPLETED",
      startedAt,
      finishedAt,
      duration,
      outputReference:
        input.processing.outputReference ??
        (output
          ? {
              outputId: output.outputId,
              contentType: output.contentType,
              kind: "processing-output",
            }
          : existing?.result.outputReference),
    };

    this.store.setProcessing({ result: processing, output });
    return {
      ok: true,
      processingId,
      processing,
      output,
      message: existing ? "processing updated" : "processing recorded",
      code: existing ? "updated" : "created",
    };
  }

  async getProcessing(input: GetProcessingInput): Promise<GetProcessingResult> {
    const stored = this.store.getProcessing(input.processingId);
    if (!stored) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, processing: stored.result, output: stored.output };
  }

  async listProcessings(input: ListProcessingsInput = {}): Promise<ListProcessingsResult> {
    const processings = this.store
      .listProcessings()
      .map((stored) => stored.result)
      .filter((processing) => matchesList(processing, input));
    return { ok: true, processings };
  }
}

function matchesList(processing: DocumentProcessingResult, input: ListProcessingsInput): boolean {
  if (input.processorType != null && processing.processorType !== input.processorType) {
    return false;
  }
  if (input.status != null && processing.status !== input.status) return false;
  if (input.tag != null && !(processing.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !processing.processingId.startsWith(input.idPrefix)) {
    return false;
  }
  if (input.documentId != null) {
    if (processing.documentIdentityReference?.documentId !== input.documentId) return false;
  }
  return true;
}
