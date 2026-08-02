/**
 * TISSRuntimePort — contrato único do TISS Runtime (TISS-01).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para coordenar operações TISS.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISSRuntimePort
 *     → Canonical Execution Orchestrator → TISSProviderPort → Adapter
 *
 * NÃO permite bypass. NÃO executa XML real / dispatch a operadoras.
 */
import type {
  GetTISSRuntimeSessionInput,
  GetTISSRuntimeSessionResult,
  ListTISSRuntimeSessionsInput,
  ListTISSRuntimeSessionsResult,
  RuntimeTISSProcessInput,
  RuntimeTISSProcessResult,
  TISSRuntimeCapabilities,
  TISSRuntimeHealth,
  TISSRuntimeProviderId,
} from "./types";

export interface TISSRuntimePort {
  readonly providerId: TISSRuntimeProviderId;

  health(): Promise<TISSRuntimeHealth>;

  capabilities(): TISSRuntimeCapabilities;

  /**
   * Processa TISS exclusivamente via TISSProviderPort.
   * Único caminho autorizado para o produto alcançar o Enterprise TISS Provider.
   */
  process(input: RuntimeTISSProcessInput): Promise<RuntimeTISSProcessResult>;

  getSession(input: GetTISSRuntimeSessionInput): Promise<GetTISSRuntimeSessionResult>;

  listSessions(input?: ListTISSRuntimeSessionsInput): Promise<ListTISSRuntimeSessionsResult>;
}
