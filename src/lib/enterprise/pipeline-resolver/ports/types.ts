/**
 * Tipos vendor-agnósticos do Pipeline Resolver — EPC-24 Sprint 02.
 *
 * O Resolver apenas descobre e compõe estruturalmente o pipeline.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → PipelineResolverPort → Adapter → Store → Factory → Provider
 */
import type {
  OfficialPortContract,
  OfficialPortRef,
  PipelineDefinition,
  PipelineResolution,
  PipelineResolutionResult,
} from "./models";

export type {
  OfficialPortContract,
  OfficialPortRef,
  PipelineDefinition,
  PipelineDependency,
  PipelineNode,
  PipelineRecord,
  PipelineRecordKind,
  PipelineResolution,
  PipelineResolutionResult,
  PipelineResolutionStatus,
  PipelineStage,
  PipelineStageName,
} from "./models";

export type {
  OfficialOrchestratedPort,
  OfficialPortRegistry,
  OfficialPortStageDescriptor,
} from "./official-ports";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Pipeline Resolver (extensível). */
export type PipelineResolverProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — resolvePipeline
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de resolução de pipeline. */
export type ResolvePipelineInput = {
  resolution?: PipelineResolution;
  pipelineId?: string;
  pipelineName?: string;
  correlationId?: string;
  tenantRef?: string;
  channel?: string;
  tags?: readonly string[];
  preferences?: Readonly<Record<string, string | number | boolean | null>>;
  structuralNotes?: string;
};

/** Resultado estrutural de resolvePipeline — sem executar etapas. */
export type ResolvePipelineResult = {
  ok: boolean;
  resolution?: PipelineResolution;
  result?: PipelineResolutionResult;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getPipeline
 * ───────────────────────────────────────────────────────────────────────── */

export type GetPipelineInput = {
  pipelineId: string;
};

export type GetPipelineResult = {
  ok: boolean;
  definition?: PipelineDefinition;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listPipelines
 * ───────────────────────────────────────────────────────────────────────── */

export type ListPipelinesInput = {
  tag?: string;
  limit?: number;
};

export type ListPipelinesResult = {
  ok: boolean;
  pipelines: readonly PipelineDefinition[];
  total: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type PipelineResolverHealth = {
  ok: boolean;
  provider: PipelineResolverProviderId;
  latencyMs?: number;
  message?: string;
  storedPipelineCount?: number;
  storedResolutionCount?: number;
  officialPortRefCount?: number;
};

/**
 * Capacidades do PipelineResolverPort (modelo PipelineCapabilities).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type PipelineCapabilities = {
  provider: PipelineResolverProviderId;
  adapterId: string;
  supportsResolvePipeline: true;
  supportsGetPipeline: true;
  supportsListPipelines: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Resolve composição exclusivamente via Ports oficiais. */
  resolvesViaOfficialPortsOnly: true;
  /** Quantidade de Ports oficiais na cadeia canônica. */
  officialPortCount: number;
  officialPortRefs: readonly OfficialPortRef[];
  officialPortContracts: readonly OfficialPortContract[];
  /** Resolução estrutural apenas — sem execução de etapas. */
  structuralResolutionOnly: true;
  stagesExecuted: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsTissRules: false;
  implementsMapping: false;
  implementsValidation: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
};

/** Alias estrutural do modelo PipelineCapabilities. */
export type PipelineResolverCapabilities = PipelineCapabilities;

/** Opções de resolução do PipelineResolverPort (provider factory). */
export type PipelineResolverProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultPipelineResolverAdapter).
   */
  provider?: PipelineResolverProviderId;
};
