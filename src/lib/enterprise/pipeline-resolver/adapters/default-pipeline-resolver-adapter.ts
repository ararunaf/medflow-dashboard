/**
 * DefaultPipelineResolverAdapter — adapter default in-memory (EPC-24 Sprint 02).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 *
 * Resolve a composição do pipeline exclusivamente via referências aos Ports oficiais.
 * Nenhuma etapa é executada.
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

export const DEFAULT_PIPELINE_RESOLVER_ADAPTER_ID = "default-in-process";
export const DEFAULT_PIPELINE_RESOLVER_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind futuro de Ports oficiais
 * sem acoplar o Resolver a detalhes de produto ou Engines.
 */
export type DefaultPipelineResolverRuntime = {
  store?: PipelineResolverStore;
  /**
   * Registry opcional de Ports oficiais (type-safe DI).
   * Nesta sprint os Ports NÃO são invocados — apenas referenciados.
   */
  officialPorts?: OfficialPortRegistry;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createResolutionId?: () => string;
  createResolutionResultId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultPipelineResolverRuntime {
  return {
    store: new DefaultPipelineResolverStore(),
  };
}

function nowIso(runtime: DefaultPipelineResolverRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultPipelineResolverAdapter implements PipelineResolverPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultPipelineResolverRuntime;
  private readonly store: PipelineResolverStore;

  constructor(runtime: DefaultPipelineResolverRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultPipelineResolverStore();
  }

  getStore(): PipelineResolverStore {
    return this.store;
  }

  getOfficialPorts(): OfficialPortRegistry | undefined {
    return this.runtime.officialPorts;
  }

  capabilities(): PipelineCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_PIPELINE_RESOLVER_ADAPTER_ID),
    };
  }

  async health(): Promise<PipelineResolverHealth> {
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
            ? "Default pipeline-resolver probe ok."
            : "Default pipeline-resolver probe falhou."),
        officialPortRefCount: OFFICIAL_PORT_REFS.length,
        storedPipelineCount: this.store.pipelineCount(),
        storedResolutionCount: this.store.resolutionCount(),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultPipelineResolverStore pronto (sem I/O externo — EPC-24 Sprint 02).",
      officialPortRefCount: OFFICIAL_PORT_REFS.length,
      storedPipelineCount: this.store.pipelineCount(),
      storedResolutionCount: this.store.resolutionCount(),
    };
  }

  async resolvePipeline(input: ResolvePipelineInput = {}): Promise<ResolvePipelineResult> {
    const stamp = nowIso(this.runtime);
    const resolutionId = this.runtime.createResolutionId?.() ?? createResolutionId();
    const resultId = this.runtime.createResolutionResultId?.() ?? createResolutionResultId();

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
