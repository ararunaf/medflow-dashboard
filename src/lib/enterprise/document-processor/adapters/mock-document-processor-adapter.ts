/**
 * MockDocumentProcessorAdapter — EPC-13.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 * NÃO executa OCR, IA, parsers ou I/O.
 */
import { createOutputId, createProcessingId } from "../ports/identity";
import type { DocumentProcessorPort } from "../ports/document-processor-port";
import type {
  DocumentProcessingResult,
  DocumentProcessorCapabilities,
  DocumentProcessorHealth,
  DocumentProcessorProviderId,
  GetProcessingInput,
  GetProcessingResult,
  ListProcessingsInput,
  ListProcessingsResult,
  ProcessInput,
  ProcessResult,
  ProcessingOutput,
} from "../ports/types";

export type MockDocumentProcessorAdapterOptions = {
  provider?: Extract<DocumentProcessorProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  processings?: readonly {
    result: DocumentProcessingResult;
    output?: ProcessingOutput;
  }[];
  createId?: () => string;
  createOutputId?: () => string;
  now?: () => string;
};

type Stored = {
  result: DocumentProcessingResult;
  output?: ProcessingOutput;
};

function computeDurationMs(startedAt?: string, finishedAt?: string): number | undefined {
  if (!startedAt || !finishedAt) return undefined;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
  return Math.max(0, end - start);
}

export class MockDocumentProcessorAdapter implements DocumentProcessorPort {
  readonly providerId: Extract<DocumentProcessorProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly processings = new Map<string, Stored>();
  private readonly createId: () => string;
  private readonly createOutputIdFn: () => string;
  private readonly now: () => string;

  constructor(options: MockDocumentProcessorAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} document-processor ready.`;
    this.createId = options.createId ?? createProcessingId;
    this.createOutputIdFn = options.createOutputId ?? createOutputId;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const processing of options.processings ?? []) {
      this.processings.set(processing.result.processingId, processing);
    }
  }

  capabilities(): DocumentProcessorCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async process(input: ProcessInput): Promise<ProcessResult> {
    const stamp = this.now();
    const processingId = input.processing.processingId ?? this.createId();
    const existing = this.processings.get(processingId);

    let output: ProcessingOutput | undefined;
    if (input.output) {
      const outputId =
        input.output.outputId ?? existing?.output?.outputId ?? this.createOutputIdFn();
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

    this.processings.set(processingId, { result: processing, output });
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
    const stored = this.processings.get(input.processingId);
    if (!stored) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, processing: stored.result, output: stored.output };
  }

  async listProcessings(input: ListProcessingsInput = {}): Promise<ListProcessingsResult> {
    const processings = [...this.processings.values()]
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
