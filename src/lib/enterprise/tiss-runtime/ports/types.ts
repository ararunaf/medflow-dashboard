/**
 * Tipos do TISS Runtime — TISS-01…TISS-10.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISSRuntimePort
 *     → TISSCatalogPort → Catalog Adapter → Store
 *     → RulePackEnginePort → Rule Pack Adapter → Store
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → NamespaceRuntimePort
 *     → Store → Canonical Namespace Runtime Result
 *     → Canonical Execution Orchestrator → TISSProviderPort → Adapter
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { RulePackEnginePort } from "../../rule-pack-engine/ports/rule-pack-engine-port";
import type { TISSCatalogPort } from "../../tiss-catalog/ports/tiss-catalog-port";
import type { TISSProviderPort } from "../../tiss-provider/ports/tiss-provider-port";
import type {
  CanonicalTISSRequest,
  CanonicalTISSResult,
} from "../../tiss-provider/ports/canonical";
import type {
  TISSProcessInput,
  TISSProviderOperationResult,
} from "../../tiss-provider/ports/types";
import type { XMLGenerationRuntimePort } from "../../xml-generation-runtime/ports/xml-generation-runtime-port";
import type { XMLRuntimePort } from "../../xml-runtime/ports/xml-runtime-port";
import type { XSDRuntimePort } from "../../xsd-runtime/ports/xsd-runtime-port";
import type { NamespaceRuntimePort } from "../../namespace-runtime/ports/namespace-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { CanonicalTISSRuntimeSession, TISSRuntimeSessionStatus } from "./models";

export type { CanonicalTISSRuntimeSession, TISSRuntimeSessionStatus };

export type {
  CanonicalTISSRequest,
  CanonicalTISSResult,
  TISSProcessInput,
  TISSProviderOperationResult,
};

/** Provedores / mecanismos do TISS Runtime (adapters do Port — não vendors). */
export type TISSRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type TISSRuntimeHealth = {
  ok: boolean;
  provider: TISSRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  tissProviderAdapterOk?: boolean;
  tissCatalogOk?: boolean;
  rulePackEngineOk?: boolean;
  xmlRuntimeOk?: boolean;
  xmlGenerationRuntimeOk?: boolean;
  xmlSerializerRuntimeOk?: boolean;
  xmlSchemaRuntimeOk?: boolean;
  xmlValidationRuntimeOk?: boolean;
  xsdRuntimeOk?: boolean;
  namespaceRuntimeOk?: boolean;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
};

/** Capacidades declaradas pelo adapter (Port level). */
export type TISSRuntimeCapabilities = {
  provider: TISSRuntimeProviderId;
  adapterId: string;
  supportsProcess: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesTISSProviderPort: boolean;
  usesTISSCatalogPort: boolean;
  usesRulePackEnginePort: boolean;
  usesXMLRuntimePort: boolean;
  usesXMLGenerationRuntimePort: boolean;
  usesXMLSerializerRuntimePort: boolean;
  usesXMLSchemaRuntimePort: boolean;
  usesXMLValidationRuntimePort: boolean;
  usesXSDRuntimePort: boolean;
  usesNamespaceRuntimePort: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
  implementsRealXml: false;
  implementsOperatorDispatch: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type TISSRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /** TISSProviderPort oficial — único caminho para Adapters TISS. */
  getTISSProviderPort(): TISSProviderPort;
  /** TISSCatalogPort oficial — única fonte de conhecimento TISS (TISS-02). */
  getTISSCatalogPort(): TISSCatalogPort;
  /** RulePackEnginePort oficial — interpretação/execução de Rule Packs (TISS-03). */
  getRulePackEnginePort(): RulePackEnginePort;
  /** XMLRuntimePort oficial — fundação estrutural de geração XML (TISS-04). */
  getXMLRuntimePort(): XMLRuntimePort;
  /** XMLGenerationRuntimePort oficial — materialização canônica (TISS-05). */
  getXMLGenerationRuntimePort(): XMLGenerationRuntimePort;
  /** XMLSerializerRuntimePort oficial — serialização canônica em texto (TISS-06). */
  /** XMLSchemaRuntimePort oficial — infraestrutura canônica de XML Schemas (TISS-07). */
  /** XMLValidationRuntimePort oficial — infraestrutura canônica de validação XML (TISS-08). */
  /** XSDRuntimePort oficial — infraestrutura canônica de gerenciamento de XSDs (TISS-09). */
  getXSDRuntimePort(): XSDRuntimePort;
  /** NamespaceRuntimePort oficial — infraestrutura canônica de namespaces XML (TISS-10). */
  getNamespaceRuntimePort(): NamespaceRuntimePort;
  /**
   * QueueRuntimePort oficial — infraestrutura canônica de filas (INF-05).
   * Dependência obrigatória preparada; TISS Runtime NÃO consome/executa filas nesta sprint.
   */
  getQueueRuntimePort(): QueueRuntimePort;
  /**
   * WorkerRuntimePort oficial — infraestrutura canônica de Workers (INF-06).
   * Dependência obrigatória preparada; TISS Runtime NÃO aloca/executa Workers nesta sprint.
   */
  /**
   * SchedulerRuntimePort oficial — infraestrutura canônica de Schedulers (INF-07).
   * Dependência obrigatória preparada; TISS Runtime NÃO agenda/executa Cron/Timers nesta sprint.
   */
  /**
   * PersistentQueueRuntimePort oficial — infraestrutura canônica de filas persistentes (INF-08).
   * Dependência obrigatória preparada; TISS Runtime NÃO persiste/consome filas nesta sprint.
   */
  getPersistentQueueRuntimePort(): PersistentQueueRuntimePort;
  /**
   * ObservabilityRuntimePort oficial — infraestrutura canônica de observabilidade (INF-09).
   * Dependência obrigatória preparada; TISS Runtime NÃO emite/observa sinais reais nesta sprint.
   */
  /**
   * ScalabilityRuntimePort oficial — infraestrutura canônica de escalabilidade (INF-10).
   * Dependência obrigatória preparada; TISS Runtime NÃO escala/balanceia nesta sprint.
   */
  getScalabilityRuntimePort(): ScalabilityRuntimePort;
};

export type GetTISSRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetTISSRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalTISSRuntimeSession;
  message?: string;
  code?: string;
};

export type ListTISSRuntimeSessionsInput = {
  status?: TISSRuntimeSessionStatus;
  idPrefix?: string;
  correlationId?: string;
};

export type ListTISSRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalTISSRuntimeSession[];
  message?: string;
  code?: string;
};

/** Input de process no Runtime — pedido canônico + controles. */
export type RuntimeTISSProcessInput = TISSProcessInput;

/** Resultado de process no Runtime — Canonical + sessão. */
export type RuntimeTISSProcessResult = TISSProviderOperationResult & {
  runtimeSessionId?: string;
  executionId?: string;
};

/** Opções de resolução do TISSRuntimePort. */
export type TISSRuntimeProviderOptions = {
  provider?: TISSRuntimeProviderId;
  enterpriseDeps?: TISSRuntimeEnterpriseDeps;
};
