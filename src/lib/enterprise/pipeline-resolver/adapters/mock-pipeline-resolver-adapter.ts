/**
 * MockPipelineResolverAdapter — EPC-24 Sprint 02.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 */
import { createResolutionId, createResolutionResultId } from "../ports/identity";
import { OFFICIAL_PORT_REFS } from "../ports/official-ports";
import type { PipelineResolverPort } from "../ports/pipeline-resolver-port";
import type {
  GetPipelineInput,
  GetPipelineResult,
  ListPipelinesInput,
  ListPipelinesResult,
  OfficialPortRegistry,
  PipelineCapabilities,
  PipelineResolverHealth,
  PipelineResolverProviderId,
  ResolvePipelineInput,
  ResolvePipelineResult,
} from "../ports/types";
import { DefaultPipelineResolverStore, type PipelineResolverStore } from "../store";
import {
  buildResolution,
  buildResolutionResult,
  filterPipelines,
  foundationCapabilitiesBase,
  persistResolution,
  resolveDefinition,
} from "./resolver-helpers";

export const MOCK_PIPELINE_RESOLVER_ADAPTER_ID = "mock-in-memory";
export const MOCK_PIPELINE_RESOLVER_VERSION = "1.0.0";

export type MockPipelineResolverAdapterOptions = {
  provider?: Extract<PipelineResolverProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: PipelineResolverStore;
  officialPorts?: OfficialPortRegistry;
  createResolutionId?: () => string;
  createResolutionResultId?: () => string;
  now?: () => string;
};

export class MockPipelineResolverAdapter implements PipelineResolverPort {
  readonly providerId: Extract<PipelineResolverProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: PipelineResolverStore;
  private readonly officialPorts?: OfficialPortRegistry;
  private readonly createResolutionIdFn: () => string;
  private readonly createResolutionResultIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockPipelineResolverAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} pipeline-resolver ready.`;
    this.store = options.store ?? new DefaultPipelineResolverStore();
    this.officialPorts = options.officialPorts;
    this.createResolutionIdFn = options.createResolutionId ?? createResolutionId;
    this.createResolutionResultIdFn = options.createResolutionResultId ?? createResolutionResultId;
    this.now = options.now;
  }

  getStore(): PipelineResolverStore {
    return this.store;
  }

  getOfficialPorts(): OfficialPortRegistry | undefined {
    return this.officialPorts;
  }

  capabilities(): PipelineCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<PipelineResolverHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      officialPortRefCount: OFFICIAL_PORT_REFS.length,
      storedPipelineCount: this.store.pipelineCount(),
      storedResolutionCount: this.store.resolutionCount(),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthy<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async resolvePipeline(input: ResolvePipelineInput = {}): Promise<ResolvePipelineResult> {
    if (!this.healthy) return this.unhealthy<ResolvePipelineResult>();

    const stamp = this.stamp();
    const resolutionId = this.createResolutionIdFn();
    const resultId = this.createResolutionResultIdFn();
    const resolution = buildResolution(input, resolutionId, stamp);
    const definition = resolveDefinition(this.store, resolution);

    if (!definition) {
      return {
        ok: false,
        resolution,
        code: "not_found",
        message: "pipeline definition not found",
      };
    }

    const result = buildResolutionResult(resolution, definition, resultId, stamp);
    persistResolution(this.store, resolution, result);

    return {
      ok: true,
      resolution,
      result,
      code: "resolved",
      message:
        "pipeline resolved structurally via official Ports — no stages executed, no engines invoked",
    };
  }

  async getPipeline(input: GetPipelineInput): Promise<GetPipelineResult> {
    if (!this.healthy) return this.unhealthy<GetPipelineResult>();

    if (!input.pipelineId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "pipelineId required",
      };
    }

    const stored = this.store.getPipeline(input.pipelineId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "pipeline definition not found",
      };
    }

    return {
      ok: true,
      definition: stored.definition,
      code: "found",
      message: "pipeline retrieved",
    };
  }

  async listPipelines(input: ListPipelinesInput = {}): Promise<ListPipelinesResult> {
    if (!this.healthy) {
      return this.unhealthy<ListPipelinesResult>({ pipelines: [], total: 0 });
    }

    const all = this.store.listPipelines().map((entry) => entry.definition);
    const pipelines = filterPipelines(all, input);
    return {
      ok: true,
      pipelines,
      total: pipelines.length,
      code: "listed",
      message: "pipelines listed",
    };
  }
}
