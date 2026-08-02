/**
 * Modelos canônicos do Health Center Foundation — INF-05 Health Center Foundation.
 *
 * Representação estrutural da infraestrutura de Health Center Enterprise.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem monitoramento real.
 * Sem health checks reais. Sem polling. Sem dashboards. Sem diagnósticos.
 * Sem Engines. Sem acesso externo. Sem consultas a componentes reais.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Health Center Foundation. */
export type CanonicalHealthComponentRecordKind =
  | "canonical-health-component"
  | "canonical-health-component-identity"
  | "canonical-health-component-status"
  | "canonical-health-component-reference"
  | "canonical-health-component-configuration"
  | "canonical-health-component-capabilities"
  | "canonical-health-component-statistics"
  | "canonical-health-component-health";

/** Valor estrutural opaco de status (sem monitoramento real). */
export type CanonicalHealthComponentStatusValue =
  | "structural"
  | "registered-structural"
  | "unregistered-structural"
  | "unknown";

/** Chaves canônicas dos componentes estruturalmente monitoráveis (futuro). */
export type StructuralHealthComponentKey =
  | "message-queue"
  | "worker-foundation"
  | "scheduler-foundation"
  | "observability-foundation"
  | "ocr"
  | "ia"
  | "rule-engine"
  | "workflow"
  | "tiss"
  | "storage"
  | "database"
  | "importacao";

/** Entrada do catálogo estrutural de componentes monitoráveis. */
export type StructuralMonitorableComponentCatalogEntry = {
  key: StructuralHealthComponentKey;
  name: string;
  notes: string;
};

/**
 * Catálogo estrutural — componentes que futuramente poderão ser monitorados.
 * Nenhum monitoramento é implementado nesta sprint.
 */
export const STRUCTURAL_MONITORABLE_COMPONENT_CATALOG: readonly StructuralMonitorableComponentCatalogEntry[] =
  [
    {
      key: "message-queue",
      name: "Message Queue",
      notes: "INF-01 — future monitorable structural component",
    },
    {
      key: "worker-foundation",
      name: "Worker Foundation",
      notes: "INF-02 — future monitorable structural component",
    },
    {
      key: "scheduler-foundation",
      name: "Scheduler Foundation",
      notes: "INF-03 — future monitorable structural component",
    },
    {
      key: "observability-foundation",
      name: "Observability Foundation",
      notes: "INF-04 — future monitorable structural component",
    },
    {
      key: "ocr",
      name: "OCR",
      notes: "Future monitorable structural component — no OCR coupling",
    },
    {
      key: "ia",
      name: "IA",
      notes: "Future monitorable structural component — no AI coupling",
    },
    {
      key: "rule-engine",
      name: "Rule Engine",
      notes: "Future monitorable structural component — no Rule Engine coupling",
    },
    {
      key: "workflow",
      name: "Workflow",
      notes: "Future monitorable structural component — no Workflow coupling",
    },
    {
      key: "tiss",
      name: "TISS",
      notes: "Future monitorable structural component — no TISS coupling",
    },
    {
      key: "storage",
      name: "Storage",
      notes: "Future monitorable structural component — no storage access",
    },
    {
      key: "database",
      name: "Banco de Dados",
      notes: "Future monitorable structural component — no database access",
    },
    {
      key: "importacao",
      name: "Importação",
      notes: "Future monitorable structural component — no import processing",
    },
  ] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentIdentity
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Identidade estrutural de um Health Component.
 * Sem identidade de runtime real / sem probe / sem health check.
 */
export type CanonicalHealthComponentIdentity = {
  kind: "canonical-health-component-identity";
  healthComponentId: string;
  executionHealthCenterId: string;
  key: string;
  name: string;
  version?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentStatus
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Status estrutural do Health Component.
 * Declara estado opaco — sem monitoramento, sem health check, sem consulta.
 */
export type CanonicalHealthComponentStatus = {
  kind: "canonical-health-component-status";
  value: CanonicalHealthComponentStatusValue;
  updatedAt: string;
  notes?: string;
  /** Monitoramento real NÃO ocorre nesta sprint. */
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um Health Component.
 * Sem conteúdo de negócio.
 */
export type CanonicalHealthComponentReference = {
  kind: "canonical-health-component-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentConfiguration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Configuração estrutural do Health Component.
 * Declara o contrato opaco — sem backends reais de health / monitoramento.
 */
export type CanonicalHealthComponentConfiguration = {
  kind: "canonical-health-component-configuration";
  key: string;
  name: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  /** Port exclusivo do Observability Foundation conhecido pelo Health Center. */
  observabilityPortContract: "ExecutionObservabilityPort";
  notes?: string;
  /** Backend real NÃO está conectado nesta sprint. */
  backendConnected: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Health Center Foundation.
 * Explicitamente sem monitoramento / health checks / Engines / backends externos.
 */
export type CanonicalHealthComponentCapabilities = {
  kind: "canonical-health-component-capabilities";
  structuralHealthCenterOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  realHealthBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpHealth: false;
  implementsRealMonitoring: false;
  implementsRealHealthChecks: false;
  /** Conhece exclusivamente ExecutionObservabilityPort (INF-04). */
  usesExecutionObservabilityPortOnly: true;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponent
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Health Component canônico estrutural.
 * Representa o cadastro estrutural de um componente monitorável — sem monitoramento.
 */
export type CanonicalHealthComponent = {
  kind: "canonical-health-component";
  id: string;
  /** Alias (= id do componente). */
  healthComponentId: string;
  /** ID do Health Center da execução — anexado ao Execution Context. */
  executionHealthCenterId: string;
  identity: CanonicalHealthComponentIdentity;
  status: CanonicalHealthComponentStatus;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  executionPolicyRegistryId?: string;
  executionConstraintRegistryId?: string;
  executionRequirementRegistryId?: string;
  executionResourceRegistryId?: string;
  executionEnvironmentRegistryId?: string;
  executionMessageQueueId?: string;
  executionWorkerId?: string;
  executionSchedulerId?: string;
  /** Referência estrutural ao Observability Foundation (via ExecutionObservabilityPort apenas). */
  executionObservabilityId?: string;
  pipelineId?: string;
  configuration: CanonicalHealthComponentConfiguration;
  references: readonly CanonicalHealthComponentReference[];
  capability: CanonicalHealthComponentCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  realHealthBackend: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do store in-memory.
 * Sem métricas de negócio / sem analytics / sem throughput real.
 */
export type CanonicalHealthComponentStatistics = {
  kind: "canonical-health-component-statistics";
  totalComponents: number;
  totalReferences: number;
  totalHealthCenters: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realHealthBackend: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalHealthComponentHealth
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Health Center Foundation (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 * NÃO é um health check real de componentes.
 */
export type CanonicalHealthComponentHealth = {
  kind: "canonical-health-component-health";
  ok: boolean;
  message?: string;
  componentCount: number;
  healthCenterCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realHealthBackend: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Health Center Foundation. */
export const STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY: CanonicalHealthComponentCapabilities =
  {
    kind: "canonical-health-component-capabilities",
    structuralHealthCenterOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    realHealthBackend: false,
    implementsOcr: false,
    implementsAi: false,
    implementsTiss: false,
    implementsXmlParser: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpHealth: false,
    implementsRealMonitoring: false,
    implementsRealHealthChecks: false,
    usesExecutionObservabilityPortOnly: true,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
