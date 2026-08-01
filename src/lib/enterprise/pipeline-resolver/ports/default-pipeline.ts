/**
 * Definição canônica do pipeline Enterprise — EPC-24 Sprint 02.
 *
 * Materialização estrutural a partir dos Ports oficiais.
 * Sem execução de etapas. Sem regras de negócio.
 */
import { createDependencyId, createNodeId, createPipelineId, createStageId } from "./identity";
import { OFFICIAL_PORT_CHAIN, OFFICIAL_PORT_CONTRACTS, OFFICIAL_PORT_REFS } from "./official-ports";
import type { PipelineDefinition, PipelineDependency, PipelineNode, PipelineStage } from "./models";

/** Identificador estável do pipeline canônico default. */
export const CANONICAL_PIPELINE_ID = "canonical-enterprise-pipeline";

/** Nome estável do pipeline canônico default. */
export const CANONICAL_PIPELINE_NAME = "canonical-enterprise-pipeline";

/** Versão estrutural do pipeline canônico. */
export const CANONICAL_PIPELINE_VERSION = "1.0.0";

export type BuildCanonicalPipelineOptions = {
  pipelineId?: string;
  createStageId?: () => string;
  createNodeId?: () => string;
  createDependencyId?: () => string;
  now?: () => string;
};

/**
 * Constrói a PipelineDefinition canônica a partir de OFFICIAL_PORT_CHAIN.
 * Ordem, metadados e dependências lineares — sem lógica de negócio.
 */
export function buildCanonicalPipelineDefinition(
  options: BuildCanonicalPipelineOptions = {},
): PipelineDefinition {
  const stamp = options.now?.() ?? new Date().toISOString();
  const stageIdFactory = options.createStageId ?? createStageId;
  const nodeIdFactory = options.createNodeId ?? createNodeId;
  const dependencyIdFactory = options.createDependencyId ?? createDependencyId;

  const stages: PipelineStage[] = [];
  const nodes: PipelineNode[] = [];
  const dependencies: PipelineDependency[] = [];

  let previousNodeId: string | undefined;

  for (const entry of OFFICIAL_PORT_CHAIN) {
    const stageId = stageIdFactory();
    const nodeId = nodeIdFactory();
    const dependencyIds: string[] = [];

    if (previousNodeId) {
      const depId = dependencyIdFactory();
      dependencies.push({
        kind: "pipeline-dependency",
        id: depId,
        fromNodeId: nodeId,
        toNodeId: previousNodeId,
        order: entry.order,
        notes: `Linear dependency: ${entry.stageName} depends on previous stage`,
      });
      dependencyIds.push(depId);
    }

    nodes.push({
      kind: "pipeline-node",
      id: nodeId,
      stageName: entry.stageName,
      order: entry.order,
      portRef: entry.portRef,
      portContract: entry.portContract,
      dependencyIds,
      notes: `Structural reference to ${entry.portContract} — not executed`,
    });

    stages.push({
      kind: "pipeline-stage",
      id: stageId,
      name: entry.stageName,
      order: entry.order,
      nodeIds: [nodeId],
      portRef: entry.portRef,
      portContract: entry.portContract,
      notes: `Stage ${entry.stageName} → ${entry.portContract}`,
    });

    previousNodeId = nodeId;
  }

  return {
    kind: "pipeline-definition",
    id: options.pipelineId ?? CANONICAL_PIPELINE_ID,
    name: CANONICAL_PIPELINE_NAME,
    version: CANONICAL_PIPELINE_VERSION,
    description: "Canonical Enterprise pipeline composition via official Ports only (structural).",
    stages,
    nodes,
    dependencies,
    officialPortRefs: OFFICIAL_PORT_REFS,
    tags: ["canonical", "enterprise", "epc-24"],
    metadata: {
      stageCount: stages.length,
      nodeCount: nodes.length,
      dependencyCount: dependencies.length,
      officialPortCount: OFFICIAL_PORT_REFS.length,
    },
    createdAt: stamp,
    updatedAt: stamp,
  };
}

/**
 * Seed factory — cria definição canônica com IDs determinísticos estáveis
 * para o store default (sem sequências mutáveis).
 */
export function createStableCanonicalPipelineDefinition(now?: () => string): PipelineDefinition {
  const stamp = now?.() ?? "1970-01-01T00:00:00.000Z";
  let stageN = 0;
  let nodeN = 0;
  let depN = 0;

  return buildCanonicalPipelineDefinition({
    pipelineId: CANONICAL_PIPELINE_ID,
    createStageId: () => `canonical-stage-${String(++stageN).padStart(2, "0")}`,
    createNodeId: () => `canonical-node-${String(++nodeN).padStart(2, "0")}`,
    createDependencyId: () => `canonical-dep-${String(++depN).padStart(2, "0")}`,
    now: () => stamp,
  });
}

/** Alias de documentação da cadeia de Ports oficiais. */
export const CANONICAL_PIPELINE_PORT_CONTRACTS = OFFICIAL_PORT_CONTRACTS;

/** Garante pipeline id único quando necessário (testes). */
export function allocatePipelineId(createId: () => string = createPipelineId): string {
  return createId();
}
