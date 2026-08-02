/**
 * Tipos do TISS Runtime — TISS-01.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISSRuntimePort
 *     → Canonical Execution Orchestrator → TISSProviderPort → Adapter
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { TISSProviderPort } from "../../tiss-provider/ports/tiss-provider-port";
import type {
  CanonicalTISSRequest,
  CanonicalTISSResult,
} from "../../tiss-provider/ports/canonical";
import type {
  TISSProcessInput,
  TISSProviderOperationResult,
} from "../../tiss-provider/ports/types";
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
