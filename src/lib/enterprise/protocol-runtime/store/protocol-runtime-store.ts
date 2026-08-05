/**
 * ProtocolRuntimeStore — contrato interno do store (C-07).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO seleciona protocolo; NÃO resolve.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  ProtocolContext,
  ProtocolProfile,
  ProtocolResolver,
  ProtocolStatistics,
} from "../ports/canonical";

export type StoredProtocolProfile = ProtocolProfile;
export type StoredProtocolContext = ProtocolContext;
export type StoredProtocolResolver = ProtocolResolver;

export interface ProtocolRuntimeStore {
  readonly storeId: string;

  getProfile(profileId: string): StoredProtocolProfile | undefined;
  setProfile(profile: StoredProtocolProfile): void;
  listProfiles(): readonly StoredProtocolProfile[];
  profileCount(): number;

  getContext(contextId: string): StoredProtocolContext | undefined;
  setContext(context: StoredProtocolContext): void;
  listContexts(): readonly StoredProtocolContext[];
  contextCount(): number;

  getResolver(resolverId: string): StoredProtocolResolver | undefined;
  setResolver(resolver: StoredProtocolResolver): void;
  listResolvers(): readonly StoredProtocolResolver[];
  resolverCount(): number;

  statistics(): ProtocolStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
