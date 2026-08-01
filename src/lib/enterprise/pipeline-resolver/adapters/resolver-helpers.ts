/**
 * Helpers internos de resolução estrutural de pipeline (EPC-24 Sprint 02).
 *
 * Somente composição / metadados in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações. Sem execução de etapas.
 */
import { CANONICAL_PIPELINE_ID, CANONICAL_PIPELINE_NAME } from "../ports/default-pipeline";
import { createResolutionId, createResolutionResultId } from "../ports/identity";
import {
  OFFICIAL_PORT_CHAIN,
  OFFICIAL_PORT_CONTRACTS,
  OFFICIAL_PORT_REFS,
} from "../ports/official-ports";
import type {
  PipelineDefinition,
  PipelineResolution,
  PipelineResolutionResult,
} from "../ports/models";
import type {
  ListPipelinesInput,
  PipelineCapabilities,
  ResolvePipelineInput,
} from "../ports/types";
import type { PipelineResolverStore } from "../store";

export function buildResolution(
  input: ResolvePipelineInput | undefined,
  resolutionId: string,
  stamp: string,
): PipelineResolution {
  const base = input?.resolution;
  return {
    kind: "pipeline-resolution",
    id: input?.resolution?.id ?? resolutionId,
    pipelineId: input?.pipelineId ?? base?.pipelineId ?? CANONICAL_PIPELINE_ID,
    pipelineName: input?.pipelineName ?? base?.pipelineName ?? CANONICAL_PIPELINE_NAME,
    correlationId: input?.correlationId ?? base?.correlationId,
    tenantRef: input?.tenantRef ?? base?.tenantRef,
    channel: input?.channel ?? base?.channel,
    tags: input?.tags ?? base?.tags,
    preferences: input?.preferences ?? base?.preferences,
    structuralNotes: input?.structuralNotes ?? base?.structuralNotes,
    requestedAt: base?.requestedAt ?? stamp,
  };
}

/**
 * Materializa o resultado estrutural a partir da definição resolvida.
 * Nenhuma etapa é executada.
 */
export function buildResolutionResult(
  resolution: PipelineResolution,
  definition: PipelineDefinition,
  resultId: string,
  stamp: string,
): PipelineResolutionResult {
  const orderedStages = [...definition.stages].sort((a, b) => a.order - b.order);
  const orderedNodes = [...definition.nodes].sort((a, b) => a.order - b.order);

  return {
    kind: "pipeline-resolution-result",
    id: resultId,
    resolutionId: resolution.id,
    pipelineId: definition.id,
    pipelineName: definition.name,
    status: "resolved",
    definition,
    orderedStages,
    orderedNodes,
    dependencies: definition.dependencies,
    officialPortRefs: definition.officialPortRefs,
    officialPortContracts: orderedNodes.map((node) => node.portContract),
    stageCount: orderedStages.length,
    nodeCount: orderedNodes.length,
    dependencyCount: definition.dependencies.length,
    enginesInvoked: false,
    stagesExecuted: false,
    resolvedViaOfficialPortsOnly: true,
    resolvedAt: stamp,
    errors: [],
    warnings: [],
    structuralNotes:
      resolution.structuralNotes ??
      "Pipeline resolved structurally via official Ports — no stages executed",
  };
}

export function resolveDefinition(
  store: PipelineResolverStore,
  resolution: PipelineResolution,
): PipelineDefinition | undefined {
  const byId = resolution.pipelineId
    ? store.getPipeline(resolution.pipelineId)?.definition
    : undefined;
  if (byId) return byId;

  if (resolution.pipelineName) {
    const byName = store
      .listPipelines()
      .find((entry) => entry.definition.name === resolution.pipelineName);
    if (byName) return byName.definition;
  }

  return store.getPipeline(CANONICAL_PIPELINE_ID)?.definition;
}

export function persistResolution(
  store: PipelineResolverStore,
  resolution: PipelineResolution,
  result: PipelineResolutionResult,
): void {
  store.setResolution({ resolution, result });
}

export function filterPipelines(
  pipelines: readonly PipelineDefinition[],
  input?: ListPipelinesInput,
): PipelineDefinition[] {
  let filtered = [...pipelines];
  if (input?.tag) {
    filtered = filtered.filter((pipeline) => pipeline.tags?.includes(input.tag!));
  }
  if (typeof input?.limit === "number" && input.limit >= 0) {
    filtered = filtered.slice(0, input.limit);
  }
  return filtered;
}

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<PipelineCapabilities, "provider"> {
  return {
    adapterId,
    supportsResolvePipeline: true,
    supportsGetPipeline: true,
    supportsListPipelines: true,
    supportsHealth: true,
    supportsCapabilities: true,
    resolvesViaOfficialPortsOnly: true,
    officialPortCount: OFFICIAL_PORT_REFS.length,
    officialPortRefs: OFFICIAL_PORT_REFS,
    officialPortContracts: OFFICIAL_PORT_CONTRACTS,
    structuralResolutionOnly: true,
    stagesExecuted: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsTissRules: false,
    implementsMapping: false,
    implementsValidation: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
  };
}

export function createIds(factories?: {
  createResolutionId?: () => string;
  createResolutionResultId?: () => string;
}): { resolutionId: string; resultId: string } {
  return {
    resolutionId: factories?.createResolutionId?.() ?? createResolutionId(),
    resultId: factories?.createResolutionResultId?.() ?? createResolutionResultId(),
  };
}

/** Ordenação estrutural documentada (OFFICIAL_PORT_CHAIN). */
export function officialPipelineOrder(): readonly string[] {
  return OFFICIAL_PORT_CHAIN.map((entry) => entry.stageName);
}
