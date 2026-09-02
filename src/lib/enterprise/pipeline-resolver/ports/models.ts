/**
 * Modelos canônicos do Pipeline Resolver — EPC-24 Sprint 02.
 *
 * Representação estrutural da composição dinâmica do pipeline Enterprise.
 * Sem regras de negócio. Sem execução de OCR, IA, Mapping, regras ou parsers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Status / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural de resolução / definição. */
export type PipelineResolutionStatus = "pending" | "resolved" | "failed" | "empty";

/** Kinds de registros canônicos do Pipeline Resolver. */
export type PipelineRecordKind =
  | "pipeline-definition"
  | "pipeline-stage"
  | "pipeline-node"
  | "pipeline-dependency"
  | "pipeline-resolution"
  | "pipeline-resolution-result";

/**
 * Identificadores estáveis dos Ports oficiais resolvíveis.
 * Referência estrutural — sem invocação de Engines.
 */
export type OfficialPortRef =
  | "document-intake"
  | "document-processor"
  | "processing-provider"
  | "ocr-provider"
  | "tiss-profile"
  | "healthcare-model"
  | "contract-rule-binding"
  | "tiss-rule-runtime";

/** Nome do contrato Port oficial correspondente. */
export type OfficialPortContract =
  | "DocumentIntakePort"
  | "DocumentProcessorPort"
  | "ProcessingProviderPort"
  | "OCRProviderPort"
  | "TISSProfilePort"
  | "HealthcareModelPort"
  | "ContractRuleBindingPort"
  | "TISSRuleRuntimePort";

/** Nome canônico de estágio do pipeline. */
export type PipelineStageName =
  | "document-intake"
  | "document-processing"
  | "processing-provider"
  | "ocr-provider"
  | "tiss-profile"
  | "healthcare-model"
  | "contract-rule-binding"
  | "tiss-rule-runtime";

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineDependency
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Dependência estrutural entre nós / estágios.
 * Sem interpretação de regra de negócio.
 */
export type PipelineDependency = {
  kind: "pipeline-dependency";
  id: string;
  /** Nó / estágio dependente. */
  fromNodeId: string;
  /** Nó / estágio pré-requisito. */
  toNodeId: string;
  /** Ordem relativa opcional. */
  order?: number;
  /** Notas estruturais. */
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineNode
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Nó estrutural do pipeline — referencia exclusivamente um Port oficial.
 */
export type PipelineNode = {
  kind: "pipeline-node";
  id: string;
  stageName: PipelineStageName;
  /** Ordem lógica (0-based). */
  order: number;
  portRef: OfficialPortRef;
  portContract: OfficialPortContract;
  /** Dependências estruturais deste nó. */
  dependencyIds?: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineStage
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estágio estrutural do pipeline (agrupa um ou mais nós).
 * Nesta fundação cada estágio contém exatamente um nó Port.
 */
export type PipelineStage = {
  kind: "pipeline-stage";
  id: string;
  name: PipelineStageName;
  order: number;
  nodeIds: readonly string[];
  portRef: OfficialPortRef;
  portContract: OfficialPortContract;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de um pipeline resolvível.
 * Sem lógica de execução.
 */
export type PipelineDefinition = {
  kind: "pipeline-definition";
  id: string;
  name: string;
  version: string;
  description?: string;
  stages: readonly PipelineStage[];
  nodes: readonly PipelineNode[];
  dependencies: readonly PipelineDependency[];
  /** Refs dos Ports oficiais na ordem canônica. */
  officialPortRefs: readonly OfficialPortRef[];
  tags?: readonly string[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  createdAt?: string;
  updatedAt?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineResolution
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Pedido / contexto estrutural de resolução de pipeline.
 */
export type PipelineResolution = {
  kind: "pipeline-resolution";
  id: string;
  pipelineId?: string;
  pipelineName?: string;
  correlationId?: string;
  tenantRef?: string;
  channel?: string;
  tags?: readonly string[];
  /** Preferências estruturais opacas (nunca interpretadas como regra). */
  preferences?: Readonly<Record<string, string | number | boolean | null>>;
  structuralNotes?: string;
  requestedAt?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * PipelineResolutionResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural da resolução dinâmica.
 * Contém a composição completa — sem executar qualquer etapa.
 */
export type PipelineResolutionResult = {
  kind: "pipeline-resolution-result";
  id: string;
  resolutionId: string;
  pipelineId: string;
  pipelineName: string;
  status: PipelineResolutionStatus;
  definition: PipelineDefinition;
  /** Estágios na ordem resolvida. */
  orderedStages: readonly PipelineStage[];
  /** Nós na ordem resolvida. */
  orderedNodes: readonly PipelineNode[];
  /** Dependências resolvidas. */
  dependencies: readonly PipelineDependency[];
  /** Refs dos Ports oficiais na ordem resolvida. */
  officialPortRefs: readonly OfficialPortRef[];
  /** Contratos Port na ordem resolvida. */
  officialPortContracts: readonly OfficialPortContract[];
  stageCount: number;
  nodeCount: number;
  dependencyCount: number;
  enginesInvoked: false;
  stagesExecuted: false;
  resolvedViaOfficialPortsOnly: true;
  resolvedAt?: string;
  errors: readonly string[];
  warnings: readonly string[];
  structuralNotes?: string;
};

/** União tipada de registros canônicos. */
export type PipelineRecord =
  | PipelineDefinition
  | PipelineStage
  | PipelineNode
  | PipelineDependency
  | PipelineResolution
  | PipelineResolutionResult;
