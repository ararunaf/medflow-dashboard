/**
 * OperatorRuntimeStore — contrato interno do store (C-04).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO resolve operadoras reais.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  OperatorCapabilityProfile,
  OperatorContext,
  OperatorRequest,
  OperatorResponse,
  OperatorStatistics,
} from "../ports/canonical";

export type StoredOperatorResponse = OperatorResponse;
export type StoredOperatorRequest = OperatorRequest;
export type StoredOperatorContext = OperatorContext;
export type StoredOperatorProfile = OperatorCapabilityProfile;

export interface OperatorRuntimeStore {
  readonly storeId: string;

  getResponse(responseId: string): StoredOperatorResponse | undefined;
  setResponse(response: StoredOperatorResponse): void;
  listResponses(): readonly StoredOperatorResponse[];
  responseCount(): number;

  getProfile(profileId: string): StoredOperatorProfile | undefined;
  setProfile(profile: StoredOperatorProfile): void;
  listProfiles(): readonly StoredOperatorProfile[];
  profileCount(): number;

  getRequest(requestId: string): StoredOperatorRequest | undefined;
  setRequest(request: StoredOperatorRequest): void;
  listRequests(): readonly StoredOperatorRequest[];
  requestCount(): number;

  getContext(contextId: string): StoredOperatorContext | undefined;
  setContext(context: StoredOperatorContext): void;
  listContexts(): readonly StoredOperatorContext[];
  contextCount(): number;

  statistics(): OperatorStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
