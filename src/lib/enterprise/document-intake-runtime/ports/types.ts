/**
 * Tipos vendor-agnósticos do Document Intake Runtime — DIP-01.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → Canonical Execution Orchestrator
 *     → DocumentIntakePort → Adapter → Implementação
 *
 * Este componente NÃO reimplementa intake. Coordena via Ports oficiais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentIntakePort } from "../../document-intake/ports/document-intake-port";
import type {
  CanonicalDocumentIntakeRequest,
  CanonicalDocumentIntakeResult,
  CanonicalDocumentIntakeSession,
  DocumentIntakeRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalDocumentIntakeCapabilities,
  CanonicalDocumentIntakeIdentity,
  CanonicalDocumentIntakeMetadata,
  CanonicalDocumentIntakeReference,
  CanonicalDocumentIntakeRequest,
  CanonicalDocumentIntakeResult,
  CanonicalDocumentIntakeSession,
  CanonicalDocumentIntakeSource,
  DocumentIntakeRuntimeSessionStatus,
} from "./models";

/** Provedores / mecanismos do Document Intake Runtime. */
export type DocumentIntakeRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type DocumentIntakeRuntimeHealth = {
  ok: boolean;
  provider: DocumentIntakeRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  documentIntakePortOk?: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 */
export type DocumentIntakeRuntimeCapabilities = {
  provider: DocumentIntakeRuntimeProviderId;
  adapterId: string;
  supportsRegisterIntake: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesDocumentIntakePort: boolean;
  implementsOcr: false;
  implementsAi: false;
  implementsXml: false;
  implementsTiss: false;
  implementsParser: false;
  implementsClassification: false;
  implementsWorkflow: false;
  implementsRuleEngine: false;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type DocumentIntakeRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getDocumentIntakePort(): DocumentIntakePort;
};

export type GetIntakeRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetIntakeRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalDocumentIntakeSession;
  message?: string;
  code?: string;
};

export type ListIntakeRuntimeSessionsInput = {
  status?: DocumentIntakeRuntimeSessionStatus;
  documentId?: string;
  sessionId?: string;
  idPrefix?: string;
};

export type ListIntakeRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalDocumentIntakeSession[];
  message?: string;
  code?: string;
};

/** Alias tipado da operação principal. */
export type RegisterIntakeInput = CanonicalDocumentIntakeRequest;
export type RegisterIntakeResult = CanonicalDocumentIntakeResult;

/** Opções de resolução do DocumentIntakeRuntimePort. */
export type DocumentIntakeRuntimeProviderOptions = {
  provider?: DocumentIntakeRuntimeProviderId;
  /**
   * Ports Enterprise injetados (obrigatório para provider `default` em produção).
   * Mock/test podem omitir e operar só com store — ou receber mocks.
   */
  enterpriseDeps?: DocumentIntakeRuntimeEnterpriseDeps;
};
