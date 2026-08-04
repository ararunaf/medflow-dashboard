/**
 * AuthorizationRuntimeStore — contrato interno do store (C-05).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO autoriza; NÃO comunica com operadoras.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  AuthorizationContext,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationStatistics,
  AuthorizationStrategy,
} from "../ports/canonical";

export type StoredAuthorizationResponse = AuthorizationResponse;
export type StoredAuthorizationRequest = AuthorizationRequest;
export type StoredAuthorizationContext = AuthorizationContext;
export type StoredAuthorizationStrategy = AuthorizationStrategy;
export type StoredAuthorizationPolicy = AuthorizationPolicy;

export interface AuthorizationRuntimeStore {
  readonly storeId: string;

  getResponse(responseId: string): StoredAuthorizationResponse | undefined;
  setResponse(response: StoredAuthorizationResponse): void;
  listResponses(): readonly StoredAuthorizationResponse[];
  responseCount(): number;

  getStrategy(strategyId: string): StoredAuthorizationStrategy | undefined;
  setStrategy(strategy: StoredAuthorizationStrategy): void;
  listStrategies(): readonly StoredAuthorizationStrategy[];
  strategyCount(): number;

  getPolicy(policyId: string): StoredAuthorizationPolicy | undefined;
  setPolicy(policy: StoredAuthorizationPolicy): void;
  listPolicies(): readonly StoredAuthorizationPolicy[];
  policyCount(): number;

  getRequest(requestId: string): StoredAuthorizationRequest | undefined;
  setRequest(request: StoredAuthorizationRequest): void;
  listRequests(): readonly StoredAuthorizationRequest[];
  requestCount(): number;

  getContext(contextId: string): StoredAuthorizationContext | undefined;
  setContext(context: StoredAuthorizationContext): void;
  listContexts(): readonly StoredAuthorizationContext[];
  contextCount(): number;

  statistics(): AuthorizationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
